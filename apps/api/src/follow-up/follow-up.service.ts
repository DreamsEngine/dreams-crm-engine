import {
	ActivityType,
	CompanyRiskLevel,
	type Db,
	DealStage,
	type Prisma,
} from "@crm/db";
import { OPEN_DEAL_STAGES } from "@crm/db/deal-stage";
import { CYCLE_DAYS_RANGE, DAY_MS, FOLLOW_UP } from "@crm/db/follow-up-config";
import { SETTINGS_ID } from "@crm/db/settings";
import { parseFollowUpOverrides } from "@crm/validation/follow-up";
import { Injectable, Logger } from "@nestjs/common";
import { InjectDatabase } from "../database/database.constants";

export type FollowUpSweepSummary = {
	staleTasks: number;
	reorderTasks: number;
	companiesScored: number;
	skipped: number;
};

export type FollowUpSettings = {
	stale: {
		defaultIdleDays: number;
		byStage: Partial<Record<DealStage, number>>;
	};
	cycle: { minEvents: number; graceFactor: number; dormantFactor: number };
	sweep: { taskDueInDays: number };
};

type CompanyRhythm = {
	lastPurchaseAt: Date | null;
	purchaseCycleDays: number | null;
	cycleOverdueDays: number | null;
	riskLevel: CompanyRiskLevel;
	purchases12m: number;
	value12m: number;
};

type PurchaseEvent = { closedAt: Date; baseAmount: number };

type SubjectCatalogue = {
	stale: (dealName: string) => string;
	reorder: (companyName: string) => string;
};

const SUBJECTS: Record<"en" | "es-MX", SubjectCatalogue> = {
	en: {
		stale: (dealName) => `Follow up: ${dealName}`,
		reorder: (companyName) => `Reorder due: ${companyName}`,
	},
	"es-MX": {
		stale: (dealName) => `Dar seguimiento: ${dealName}`,
		reorder: (companyName) => `Recompra vencida: ${companyName}`,
	},
};

const DEFAULT_LOCALE = "en";

const CHASING_RISK: CompanyRiskLevel[] = [
	CompanyRiskLevel.OVERDUE,
	CompanyRiskLevel.DORMANT,
];

const YEAR_DAYS = 365;

export function medianCycleDays(events: PurchaseEvent[]): number | null {
	if (events.length < 2) return null;

	const gaps = events
		.slice(1)
		.map(
			(event, index) =>
				(event.closedAt.getTime() -
					(events[index] as PurchaseEvent).closedAt.getTime()) /
				DAY_MS,
		)
		.sort((a, b) => a - b);

	const middle = Math.floor(gaps.length / 2);
	const median =
		gaps.length % 2 === 1
			? (gaps[middle] as number)
			: ((gaps[middle - 1] as number) + (gaps[middle] as number)) / 2;

	return Math.min(
		CYCLE_DAYS_RANGE.max,
		Math.max(CYCLE_DAYS_RANGE.min, Math.round(median)),
	);
}

function readRhythm(
	events: PurchaseEvent[],
	settings: FollowUpSettings,
	now: Date,
): CompanyRhythm {
	const ordered = [...events].sort(
		(a, b) => a.closedAt.getTime() - b.closedAt.getTime(),
	);
	const last = ordered.at(-1) ?? null;
	const trailing = now.getTime() - YEAR_DAYS * DAY_MS;
	const recent = ordered.filter(
		(event) => event.closedAt.getTime() >= trailing,
	);

	const rhythm: CompanyRhythm = {
		lastPurchaseAt: last?.closedAt ?? null,
		purchaseCycleDays: null,
		cycleOverdueDays: null,
		riskLevel: CompanyRiskLevel.NEW,
		purchases12m: recent.length,
		value12m: recent.reduce((total, event) => total + event.baseAmount, 0),
	};

	if (!last || ordered.length < settings.cycle.minEvents) return rhythm;

	const cycleDays = medianCycleDays(ordered);
	if (cycleDays === null) return rhythm;

	const daysSince = (now.getTime() - last.closedAt.getTime()) / DAY_MS;
	const dormantAt = Math.min(
		cycleDays * settings.cycle.dormantFactor,
		YEAR_DAYS,
	);

	rhythm.purchaseCycleDays = cycleDays;
	rhythm.cycleOverdueDays = Math.max(0, Math.round(daysSince - cycleDays));

	if (daysSince >= dormantAt) {
		rhythm.riskLevel = CompanyRiskLevel.DORMANT;
	} else if (daysSince >= cycleDays * settings.cycle.graceFactor) {
		rhythm.riskLevel = CompanyRiskLevel.OVERDUE;
	} else if (daysSince >= cycleDays) {
		rhythm.riskLevel = CompanyRiskLevel.DUE;
	} else {
		rhythm.riskLevel = CompanyRiskLevel.STEADY;
	}

	return rhythm;
}

@Injectable()
export class FollowUpService {
	private readonly logger = new Logger(FollowUpService.name);

	constructor(@InjectDatabase() private readonly db: Db) {}

	async settings(): Promise<FollowUpSettings> {
		const row = await this.db.appSetting.findUnique({
			where: { id: SETTINGS_ID },
			select: { followUp: true },
		});

		const overrides = parseFollowUpOverrides(row?.followUp ?? null);

		return {
			stale: {
				defaultIdleDays:
					overrides.stale?.defaultIdleDays ?? FOLLOW_UP.stale.defaultIdleDays,
				byStage: { ...FOLLOW_UP.stale.byStage, ...overrides.stale?.byStage },
			},
			cycle: { ...FOLLOW_UP.cycle, ...overrides.cycle },
			sweep: { ...FOLLOW_UP.sweep, ...overrides.sweep },
		};
	}

	async sweep(now = new Date()): Promise<FollowUpSweepSummary> {
		const settings = await this.settings();
		const summary: FollowUpSweepSummary = {
			staleTasks: 0,
			reorderTasks: 0,
			companiesScored: 0,
			skipped: 0,
		};

		const stale = await this.chaseStaleDeals(settings, now);
		summary.staleTasks = stale.created;
		summary.skipped += stale.skipped;

		const rhythm = await this.scoreCompanies(settings, now);
		summary.companiesScored = rhythm.scored;
		summary.reorderTasks = rhythm.created;
		summary.skipped += rhythm.skipped;

		this.logger.log({ message: "Follow-up sweep finished", ...summary });

		return summary;
	}

	private async chaseStaleDeals(
		settings: FollowUpSettings,
		now: Date,
	): Promise<{ created: number; skipped: number }> {
		const deals = await this.db.deal.findMany({
			where: { stage: { in: [...OPEN_DEAL_STAGES] } },
			select: {
				id: true,
				name: true,
				companyId: true,
				ownerId: true,
				stage: true,
				stageChangedAt: true,
			},
		});

		if (deals.length === 0) return { created: 0, skipped: 0 };

		const chased = await this.openTargets("stale");
		const lastActivity = await this.lastActivityByDeal(
			deals.map((deal) => deal.id),
		);

		let created = 0;
		let skipped = 0;

		for (const deal of deals) {
			const idleDays =
				settings.stale.byStage[deal.stage] ?? settings.stale.defaultIdleDays;
			const since = lastActivity.get(deal.id) ?? deal.stageChangedAt;

			if (now.getTime() - since.getTime() < idleDays * DAY_MS) continue;

			if (chased.has(deal.id)) {
				skipped += 1;
				continue;
			}

			await this.createTask({
				subject: this.subjects().stale(deal.name),
				companyId: deal.companyId,
				dealId: deal.id,
				createdById: deal.ownerId,
				dueAt: this.dueAt(settings, now),
				meta: {
					followUp: "stale",
					stage: deal.stage,
					idleDays,
					idleSince: since.toISOString(),
				},
			});

			created += 1;
		}

		return { created, skipped };
	}

	private async scoreCompanies(
		settings: FollowUpSettings,
		now: Date,
	): Promise<{ scored: number; created: number; skipped: number }> {
		const companies = await this.db.company.findMany({
			select: { id: true, name: true, ownerId: true },
		});

		if (companies.length === 0) return { scored: 0, created: 0, skipped: 0 };

		const purchases = await this.purchasesByCompany();
		const chased = await this.openTargets("reorder");

		let scored = 0;
		let created = 0;
		let skipped = 0;
		let fallbackOwner: string | null | undefined;

		for (const company of companies) {
			const rhythm = readRhythm(purchases.get(company.id) ?? [], settings, now);

			await this.db.company.update({
				where: { id: company.id },
				data: {
					lastPurchaseAt: rhythm.lastPurchaseAt,
					purchaseCycleDays: rhythm.purchaseCycleDays,
					cycleOverdueDays: rhythm.cycleOverdueDays,
					riskLevel: rhythm.riskLevel,
					riskComputedAt: now,
				},
			});

			scored += 1;

			if (!CHASING_RISK.includes(rhythm.riskLevel)) continue;

			if (chased.has(company.id)) {
				skipped += 1;
				continue;
			}

			if (fallbackOwner === undefined)
				fallbackOwner = await this.earliestUser();

			const createdById = company.ownerId ?? fallbackOwner;
			if (!createdById) continue;

			await this.createTask({
				subject: this.subjects().reorder(company.name),
				companyId: company.id,
				dealId: null,
				createdById,
				dueAt: this.dueAt(settings, now),
				meta: {
					followUp: "reorder",
					riskLevel: rhythm.riskLevel,
					cycleDays: rhythm.purchaseCycleDays,
					overdueDays: rhythm.cycleOverdueDays,
					purchases12m: rhythm.purchases12m,
					value12m: rhythm.value12m,
				},
			});

			created += 1;
		}

		return { scored, created, skipped };
	}

	private async lastActivityByDeal(
		dealIds: string[],
	): Promise<Map<string, Date>> {
		const rows = await this.db.activity.groupBy({
			by: ["dealId"],
			where: { dealId: { in: dealIds } },
			_max: { createdAt: true, occurredAt: true },
		});

		const latest = new Map<string, Date>();

		for (const row of rows) {
			if (!row.dealId) continue;

			const candidates = [row._max.createdAt, row._max.occurredAt].filter(
				(value): value is Date => value !== null,
			);
			if (candidates.length === 0) continue;

			latest.set(
				row.dealId,
				new Date(Math.max(...candidates.map((value) => value.getTime()))),
			);
		}

		return latest;
	}

	private async purchasesByCompany(): Promise<Map<string, PurchaseEvent[]>> {
		const rows = await this.db.deal.findMany({
			where: { stage: DealStage.CLOSED_WON, closedAt: { not: null } },
			select: { companyId: true, closedAt: true, baseAmount: true },
			orderBy: { closedAt: "asc" },
		});

		const events = new Map<string, PurchaseEvent[]>();

		for (const row of rows) {
			if (!row.closedAt) continue;

			const existing = events.get(row.companyId) ?? [];
			existing.push({
				closedAt: row.closedAt,
				baseAmount: row.baseAmount?.toNumber() ?? 0,
			});
			events.set(row.companyId, existing);
		}

		return events;
	}

	private async openTargets(kind: "stale" | "reorder"): Promise<Set<string>> {
		const rows = await this.db.activity.findMany({
			where: {
				type: ActivityType.TASK,
				completedAt: null,
				meta: { path: ["followUp"], equals: kind },
			},
			select: { companyId: true, dealId: true },
		});

		const targets = new Set<string>();

		for (const row of rows) {
			const id = kind === "stale" ? row.dealId : row.companyId;
			if (id) targets.add(id);
		}

		return targets;
	}

	private async earliestUser(): Promise<string | null> {
		const user = await this.db.user.findFirst({
			orderBy: { createdAt: "asc" },
			select: { id: true },
		});

		return user?.id ?? null;
	}

	private async createTask(task: {
		subject: string;
		companyId: string | null;
		dealId: string | null;
		createdById: string;
		dueAt: Date;
		meta: Prisma.InputJsonValue;
	}): Promise<void> {
		await this.db.activity.create({
			data: {
				type: ActivityType.TASK,
				subject: task.subject,
				companyId: task.companyId,
				dealId: task.dealId,
				createdById: task.createdById,
				dueAt: task.dueAt,
				meta: task.meta,
			},
		});
	}

	private dueAt(settings: FollowUpSettings, now: Date): Date {
		return new Date(now.getTime() + settings.sweep.taskDueInDays * DAY_MS);
	}

	private subjects(): SubjectCatalogue {
		const locale = process.env.LOCALE;

		return locale !== undefined && locale in SUBJECTS
			? (SUBJECTS[locale as keyof typeof SUBJECTS] as SubjectCatalogue)
			: SUBJECTS[DEFAULT_LOCALE];
	}
}
