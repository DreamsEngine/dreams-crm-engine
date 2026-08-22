# Follow-up engine (module M1)

Flag: `FOLLOWUP=1`. Off by default; a missing flag removes the capability and
nothing throws. One repo, no client branches — this file is the binding design
for the module.

## What it does

Three deterministic detections, one sweep, no LLM:

1. **Stale deals** — an open deal whose stage has not moved and whose last
   activity is older than the stage's idle threshold gets a follow-up task
   assigned to the deal owner.
2. **Reorder rhythm** — for each company, the median gap between its purchase
   events (today: `CLOSED_WON` deals by `closedAt`; later: store orders (M2)
   and stamped invoices (M3) union in). A company whose gap since the last
   purchase exceeds `cycleDays × graceFactor` is overdue to reorder and gets a
   task on its owner.
3. **Health (RFM)** — recency (days since last purchase), frequency (events in
   the trailing 12 months), monetary (sum of `baseAmount` trailing 12 months),
   folded into `riskLevel`: `steady | due | overdue | dormant | new`.

Intelligence stays out of the API: the sweep only writes rows. LLM-drafted
chase messages are v1.1 — the sweep enqueues an `AgentTask`
(`kind: "followup.chase"`) and the agent drafts; while the AI key is absent the
task subject alone ships.

## Where it runs

`POST /internal/followup/sweep`, guarded by `CRON_SECRET` exactly like
`/internal/sync/mailboxes` (same controller pattern, `AllowAnonymous` +
timing-safe bearer check). Refuses with 503 when `FOLLOWUP` is not `1`.
Idempotent per day: a detection that already produced an open, uncompleted
task for the same deal/company and same kind does not produce another.
Cron cadence: hourly.

## Data

New columns on `Company` (denormalised by the sweep so tables can sort and
filter without recomputation):

```prisma
lastPurchaseAt    DateTime?
purchaseCycleDays Int?
cycleOverdueDays  Int?
riskLevel         CompanyRiskLevel @default(NEW)
riskComputedAt    DateTime?
```

`enum CompanyRiskLevel { NEW STEADY DUE OVERDUE DORMANT }`

Rules for the rhythm:

- Fewer than 3 purchase events → `purchaseCycleDays` stays null, risk is `NEW`
  (never flag a company we cannot read yet).
- `cycleDays` = median of gaps between consecutive events, clamped to
  [7, 365].
- `due` at `1.0×` cycle since last purchase, `overdue` at `graceFactor` (1.35×),
  `dormant` at `3×` or 365 days, whichever is first.

Tasks are ordinary `Activity` rows (`type: TASK`, `dealId`/`companyId` set,
`createdById` = company/deal owner, fallback first user). Subjects come from
the module's message catalogue keys (`shared.followUp.*`) resolved at render —
store the key-like English subject; UI already renders activity subjects as
text, so v1 stores localised text at creation using the instance locale.

## Config

`packages/db/src/follow-up-config.ts`, one object, `as const`, derived from
`DAY_MS` — the `dispatch-config.ts` pattern:

```ts
export const FOLLOW_UP = {
	stale: { defaultIdleDays: 7, byStage: { CONTRACT_SENT: 4, DEMO_BOOKED: 5 } },
	cycle: { minEvents: 3, graceFactor: 1.35, dormantFactor: 3 },
	sweep: { taskDueInDays: 2 },
} as const;
```

Per-instance overrides live in `AppSetting.followUp` (Json, nullable), parsed
at the boundary with a Zod schema in `packages/validation/src/follow-up.ts` —
never read raw.

## UI (flag-gated)

- Companies table: `Salud` column (risk pill: colours from the semantic
  success/warning/destructive tokens, never the accent) + `Última compra` and
  `Ciclo` columns, sortable. Hidden when the flag is off (server passes the
  flag as finished data; client components never read env).
- Companies view filter: `En riesgo` (risk in `DUE | OVERDUE | DORMANT`).
- Overview: the existing overdue-tasks widget carries the sweep's tasks with
  no change.

## Env

`FOLLOWUP` declared in `apps/api/src/config/env.validation.ts` (optional
string), passed through `turbo.json` `globalPassThroughEnv`, added to both
Coolify compose files for api and app services. `.env.example` cannot be
edited by tooling — add manually:

```
# Follow-up engine: stale-deal chases, reorder-cycle detection, company health.
# FOLLOWUP="1"
```

## Tests

Integration tests in `apps/api` against `TEST_DATABASE_URL` (repo pattern):
rhythm median/clamps, grace thresholds, idempotent sweep (run twice, one task),
flag-off 503, stale-deal threshold per stage.
