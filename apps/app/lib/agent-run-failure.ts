import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations>;

const KNOWN_CODES = new Set([
	"ACTION_NOT_PERFORMED",
	"NO_EXECUTOR",
	"DEPENDENCY_UNAVAILABLE",
	"NOT_AUTHORISED",
	"PROVIDER_ERROR",
	"NEVER_SETTLED",
	"TURN_FAILED",
	"DELIVERY_FAILED",
	"DELIVERY_EXHAUSTED",
	"ACTION_REJECTED",
	"AGENT_UNAVAILABLE",
	"AGENT_DELETED",
	"CANCELLED_BY_USER",
	"RUN_TIMED_OUT",
]);

export function runFailureReason(
	code: string | null | undefined,
	message: string | null | undefined,
	t: Translator,
): string {
	const known = code && KNOWN_CODES.has(code) ? code : undefined;
	if (known) return t(`agentHistory.failureReasons.${known}`);
	if (message?.trim()) return message.trim();
	return t("agentHistory.failureReasonUnknown");
}
