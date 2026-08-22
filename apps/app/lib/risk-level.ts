import type { CompanyRiskLevel } from "@crm/db/enums";

export const RISK_LEVEL_BADGE_VARIANT: Record<
	CompanyRiskLevel,
	"success" | "warning" | "destructive" | "muted"
> = {
	NEW: "muted",
	STEADY: "success",
	DUE: "warning",
	OVERDUE: "destructive",
	DORMANT: "muted",
};
