import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import {
	ActivityType,
	CompanyRiskLevel,
	type Db,
	DealStage,
	db,
} from "@crm/db";
import { DAY_MS } from "@crm/db/follow-up-config";
import { SETTINGS_ID } from "@crm/db/settings";
import type { ConfigService } from "@nestjs/config";
import type { EnvironmentVariables } from "../src/config/env.validation";
import { FollowUpController } from "../src/follow-up/follow-up.controller";
import {
	FollowUpService,
	medianCycleDays,
} from "../src/follow-up/follow-up.service";

const suffix = process.env.TEST_RUN_ID ?? "follow-up-spec";
const userId = `user-${suffix}`;
const domain = `followup-${suffix}.test`;

const service = new FollowUpService(db as Db);

const now = new Date();

const companies = new Map<string, string>();
const deals = new Map<string, string>();

function ago(days: number): Date {
	return new Date(now.getTime() - days * DAY_MS);
}

async function company(key: string): Promise<string> {
	const row = await db.company.upsert({
		where: { domain: `${key}.${domain}` },
		create: {
			name: `${key} ${suffix}`,
			domain: `${key}.${domain}`,
			ownerId: userId,
		},
		update: { ownerId: userId },
		select: { id: true },
	});

	companies.set(key, row.id);
	return row.id;
}

async function win(companyId: string, closedAt: Date, baseAmount: number) {
	await db.deal.create({
		data: {
			name: `Win ${closedAt.toISOString()} ${suffix}`,
			companyId,
			ownerId: userId,
			stage: DealStage.CLOSED_WON,
			stageChangedAt: closedAt,
			closedAt,
			amount: baseAmount,
			currency: "USD",
			baseAmount,
			baseCurrency: "USD",
		},
	});
}

async function openDeal(key: string, stage: DealStage, stageChangedAt: Date) {
	const row = await db.deal.create({
		data: {
			name: `${key} ${suffix}`,
			companyId: companies.get("deals") as string,
			ownerId: userId,
			stage,
			stageChangedAt,
		},
		select: { id: true },
	});

	deals.set(key, row.id);
	return row.id;
}

async function tasksOnDeal(key: string): Promise<number> {
	return db.activity.count({
		where: {
			dealId: deals.get(key),
			type: ActivityType.TASK,
			meta: { path: ["followUp"], equals: "stale" },
		},
	});
}

async function tasksOnCompany(key: string): Promise<number> {
	return db.activity.count({
		where: {
			companyId: companies.get(key),
			type: ActivityType.TASK,
			meta: { path: ["followUp"], equals: "reorder" },
		},
	});
}

async function riskOf(key: string) {
	return db.company.findUniqueOrThrow({
		where: { id: companies.get(key) },
		select: {
			riskLevel: true,
			purchaseCycleDays: true,
			cycleOverdueDays: true,
			lastPurchaseAt: true,
			riskComputedAt: true,
		},
	});
}

async function writeOverrides(value: unknown) {
	await db.appSetting.upsert({
		where: { id: SETTINGS_ID },
		create: { id: SETTINGS_ID, followUp: value as never },
		update: { followUp: value as never },
	});
}

beforeAll(async () => {
	await db.user.upsert({
		where: { id: userId },
		create: {
			id: userId,
			name: "Follow-up Tester",
			email: `sweeper@${domain}`,
			emailVerified: true,
		},
		update: {},
	});

	for (const key of [
		"overdue",
		"due",
		"steady",
		"young",
		"tight",
		"wide",
		"dormant",
		"deals",
	]) {
		await company(key);
	}

	const overdue = companies.get("overdue") as string;
	await win(overdue, ago(110), 1_000);
	await win(overdue, ago(80), 2_000);
	await win(overdue, ago(50), 3_000);

	const due = companies.get("due") as string;
	await win(due, ago(95), 1_000);
	await win(due, ago(65), 1_000);
	await win(due, ago(35), 1_000);

	const steady = companies.get("steady") as string;
	await win(steady, ago(70), 500);
	await win(steady, ago(40), 500);
	await win(steady, ago(10), 500);

	const young = companies.get("young") as string;
	await win(young, ago(60), 700);
	await win(young, ago(30), 700);

	const tight = companies.get("tight") as string;
	await win(tight, ago(6), 100);
	await win(tight, ago(4), 100);
	await win(tight, ago(2), 100);

	const wide = companies.get("wide") as string;
	await win(wide, ago(1_200), 100);
	await win(wide, ago(700), 100);
	await win(wide, ago(200), 100);

	const dormant = companies.get("dormant") as string;
	await win(dormant, ago(260), 900);
	await win(dormant, ago(230), 900);
	await win(dormant, ago(200), 900);

	await openDeal("contract", DealStage.CONTRACT_SENT, ago(4.5));
	await openDeal("demo", DealStage.DEMO_BOOKED, ago(4.5));
	await openDeal("qualified", DealStage.QUALIFIED_TO_BUY, ago(8));
	await openDeal("fresh", DealStage.QUALIFIED_TO_BUY, ago(1));
	await openDeal("touched", DealStage.CONTRACT_SENT, ago(30));

	await db.activity.create({
		data: {
			type: ActivityType.NOTE,
			subject: `Called them ${suffix}`,
			dealId: deals.get("touched"),
			createdById: userId,
			createdAt: ago(1),
			occurredAt: ago(1),
		},
	});

	await writeOverrides(null);
});

afterAll(async () => {
	await writeOverrides(null);
	await db.company.deleteMany({ where: { domain: { endsWith: domain } } });
	await db.user.deleteMany({ where: { id: userId } });
});

describe("the median purchase cycle", () => {
	it("takes the middle gap and averages an even pair", () => {
		const events = [0, 10, 30, 60, 100].map((days) => ({
			closedAt: new Date(days * DAY_MS),
			baseAmount: 0,
		}));

		expect(medianCycleDays(events)).toBe(25);
		expect(medianCycleDays(events.slice(0, 4))).toBe(20);
		expect(medianCycleDays(events.slice(0, 1))).toBeNull();
	});
});

describe("a sweep reads every company's rhythm", () => {
	beforeAll(async () => {
		await service.sweep(now);
	});

	it("clamps a cycle that is too short or too long into [7, 365]", async () => {
		expect((await riskOf("tight")).purchaseCycleDays).toBe(7);
		expect((await riskOf("wide")).purchaseCycleDays).toBe(365);
	});

	it("never reads a company with fewer than three purchases", async () => {
		const young = await riskOf("young");

		expect(young.riskLevel).toBe(CompanyRiskLevel.NEW);
		expect(young.purchaseCycleDays).toBeNull();
		expect(young.cycleOverdueDays).toBeNull();
		expect(young.lastPurchaseAt?.getTime()).toBe(ago(30).getTime());
		expect(young.riskComputedAt).not.toBeNull();
	});

	it("holds a company inside its cycle at steady", async () => {
		const steady = await riskOf("steady");

		expect(steady.riskLevel).toBe(CompanyRiskLevel.STEADY);
		expect(steady.purchaseCycleDays).toBe(30);
		expect(steady.cycleOverdueDays).toBe(0);
	});

	it("marks a company due at one cycle and does not chase it", async () => {
		const due = await riskOf("due");

		expect(due.riskLevel).toBe(CompanyRiskLevel.DUE);
		expect(due.cycleOverdueDays).toBe(5);
		expect(await tasksOnCompany("due")).toBe(0);
	});

	it("marks a company overdue past the grace factor and chases it", async () => {
		const overdue = await riskOf("overdue");

		expect(overdue.riskLevel).toBe(CompanyRiskLevel.OVERDUE);
		expect(overdue.purchaseCycleDays).toBe(30);
		expect(overdue.cycleOverdueDays).toBe(20);
		expect(await tasksOnCompany("overdue")).toBe(1);
	});

	it("marks a company dormant past the dormant factor", async () => {
		expect((await riskOf("dormant")).riskLevel).toBe(CompanyRiskLevel.DORMANT);
		expect(await tasksOnCompany("dormant")).toBe(1);
	});

	it("dates the chase task and puts it on the company owner", async () => {
		const task = await db.activity.findFirstOrThrow({
			where: {
				companyId: companies.get("overdue"),
				type: ActivityType.TASK,
				meta: { path: ["followUp"], equals: "reorder" },
			},
			select: { subject: true, dueAt: true, createdById: true },
		});

		expect(task.createdById).toBe(userId);
		expect(task.subject).toContain("Reorder due");
		expect(task.dueAt?.getTime()).toBe(now.getTime() + 2 * DAY_MS);
	});
});

describe("a stale deal is read against its own stage", () => {
	it("chases a contract sitting longer than the contract threshold", async () => {
		expect(await tasksOnDeal("contract")).toBe(1);
	});

	it("leaves a demo of the same age alone, because its threshold is longer", async () => {
		expect(await tasksOnDeal("demo")).toBe(0);
	});

	it("falls back to the default threshold for a stage with none", async () => {
		expect(await tasksOnDeal("qualified")).toBe(1);
		expect(await tasksOnDeal("fresh")).toBe(0);
	});

	it("counts the last activity, not the stage change", async () => {
		expect(await tasksOnDeal("touched")).toBe(0);
	});
});

describe("a second sweep on the same day", () => {
	it("writes no second task and says what it skipped", async () => {
		const summary = await service.sweep(now);

		expect(await tasksOnCompany("overdue")).toBe(1);
		expect(await tasksOnDeal("contract")).toBe(1);
		expect(summary.skipped).toBeGreaterThan(0);
		expect(summary.companiesScored).toBeGreaterThan(0);
	});

	it("does not chase a deal again while its first task is open", async () => {
		await db.activity.updateMany({
			where: {
				dealId: deals.get("contract"),
				type: ActivityType.TASK,
				meta: { path: ["followUp"], equals: "stale" },
			},
			data: { createdAt: ago(30) },
		});

		const summary = await service.sweep(now);

		expect(await tasksOnDeal("contract")).toBe(1);
		expect(summary.staleTasks).toBe(0);
		expect(summary.skipped).toBeGreaterThan(0);
	});
});

describe("the instance can retune the sweep", () => {
	afterAll(async () => {
		await writeOverrides(null);
	});

	it("chases a due company once the grace factor drops to one", async () => {
		await writeOverrides({ cycle: { graceFactor: 1 } });

		await service.sweep(now);

		expect((await riskOf("due")).riskLevel).toBe(CompanyRiskLevel.OVERDUE);
		expect(await tasksOnCompany("due")).toBe(1);
	});

	it("refuses a stored override it cannot read", async () => {
		await writeOverrides({ cycle: { graceFactor: "soon" } });

		await expect(service.sweep(now)).rejects.toThrow(/unreadable/);
	});
});

describe("the sweep route", () => {
	function controller(env: Partial<EnvironmentVariables>) {
		const config = {
			get: (key: keyof EnvironmentVariables) => env[key],
		} as unknown as ConfigService<EnvironmentVariables, true>;

		return new FollowUpController(service, config);
	}

	it("refuses with 503 while the flag is off", async () => {
		const route = controller({ CRON_SECRET: "a".repeat(32) });

		await expect(route.sweepViaPost("Bearer irrelevant")).rejects.toThrow(
			/follow-up module is off/,
		);
	});

	it("refuses an unsigned caller while the flag is on", async () => {
		const route = controller({ FOLLOWUP: "1", CRON_SECRET: "a".repeat(32) });

		await expect(route.sweepViaGet("Bearer wrong")).rejects.toThrow(
			/Forbidden/,
		);
	});
});
