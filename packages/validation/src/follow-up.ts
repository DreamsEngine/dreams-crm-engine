import { DealStage } from "@crm/db/enums";
import { z } from "zod";

const idleDays = z.number().int().min(1).max(365);

const factor = z.number().min(1).max(20);

export const followUpOverrides = z.object({
	stale: z
		.object({
			defaultIdleDays: idleDays.optional(),
			byStage: z.partialRecord(z.enum(DealStage), idleDays).optional(),
		})
		.optional(),
	cycle: z
		.object({
			minEvents: z.number().int().min(2).max(50).optional(),
			graceFactor: factor.optional(),
			dormantFactor: factor.optional(),
		})
		.optional(),
	sweep: z
		.object({
			taskDueInDays: z.number().int().min(0).max(90).optional(),
		})
		.optional(),
});

export type FollowUpOverrides = z.infer<typeof followUpOverrides>;

export class InvalidFollowUpOverrides extends Error {
	constructor(readonly issues: string) {
		super(`AppSetting.followUp is unreadable: ${issues}`);
		this.name = "InvalidFollowUpOverrides";
	}
}

export function parseFollowUpOverrides(value: unknown): FollowUpOverrides {
	if (value === null || value === undefined) return {};

	const parsed = followUpOverrides.safeParse(value);
	if (parsed.success) return parsed.data;

	throw new InvalidFollowUpOverrides(
		parsed.error.issues
			.map((issue) => `${issue.path.join(".") || "followUp"} ${issue.message}`)
			.join("; "),
	);
}
