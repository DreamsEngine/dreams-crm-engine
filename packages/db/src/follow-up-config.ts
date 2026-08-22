const MINUTE_MS = 60_000;

export const DAY_MS = 24 * 60 * MINUTE_MS;

export const FOLLOW_UP = {
	stale: { defaultIdleDays: 7, byStage: { CONTRACT_SENT: 4, DEMO_BOOKED: 5 } },
	cycle: { minEvents: 3, graceFactor: 1.35, dormantFactor: 3 },
	sweep: { taskDueInDays: 2 },
} as const;

export const CYCLE_DAYS_RANGE = { min: 7, max: 365 } as const;
