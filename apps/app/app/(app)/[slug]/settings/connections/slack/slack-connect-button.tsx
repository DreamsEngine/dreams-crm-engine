"use client";

import { authClient } from "@crm/auth/client";
import { Button } from "@crm/ui/components/button";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

type SettingsTranslator = ReturnType<typeof useTranslations<"settings">>;

const CONNECT_ERROR_KEYS: Record<string, string> = {
	access_denied: "accessDenied",
	account_already_linked_to_different_user: "alreadyLinked",
	"email_doesn't_match": "emailMismatch",
	oauth_code_verification_failed: "oauthVerificationFailed",
	user_info_is_missing: "userInfoMissing",
};

function connectErrorMessage(t: SettingsTranslator, code: string): string {
	switch (CONNECT_ERROR_KEYS[code]) {
		case "accessDenied":
			return t("connections.slack.connectButton.errors.accessDenied");
		case "alreadyLinked":
			return t("connections.slack.connectButton.errors.alreadyLinked");
		case "emailMismatch":
			return t("connections.slack.connectButton.errors.emailMismatch");
		case "oauthVerificationFailed":
			return t(
				"connections.slack.connectButton.errors.oauthVerificationFailed",
			);
		case "userInfoMissing":
			return t("connections.slack.connectButton.errors.userInfoMissing");
		default:
			return t("connections.slack.connectButton.connectErrorFallback", {
				code: code.replaceAll("_", " "),
			});
	}
}

async function startSlackOAuth(t: SettingsTranslator, slug: string) {
	const fallback = t("connections.slack.connectButton.connectFailedDefault");
	try {
		const { error } = await authClient.oauth2.link({
			providerId: "slack",
			callbackURL: `${window.location.origin}/${slug}/settings/connections/slack/people`,
			errorCallbackURL: `${window.location.origin}/${slug}/settings/connections/slack?provider=slack`,
		});
		if (error) toast.error(error.message || fallback);
	} catch (error) {
		toast.error(error instanceof Error ? error.message : fallback);
	}
}

export function SlackReconnectButton({ slug }: { slug: string }) {
	const t = useTranslations("settings");
	const [pending, setPending] = useState(false);

	return (
		<Button
			disabled={pending}
			onClick={async () => {
				setPending(true);
				await startSlackOAuth(t, slug);
				setPending(false);
			}}
			size="xs"
			variant="contrast"
		>
			{pending
				? t("connections.slack.connectButton.openingSlack")
				: t("connections.slack.connectButton.reconnect")}
		</Button>
	);
}

export function SlackConnectButton({
	slug,
	configured,
	connectError,
}: {
	slug: string;
	configured: boolean;
	connectError?: string;
}) {
	const t = useTranslations("settings");
	const [pending, setPending] = useState(false);
	const connect = async () => {
		setPending(true);
		await startSlackOAuth(t, slug);
		setPending(false);
	};
	return (
		<div className="flex min-w-0 flex-col gap-2">
			<Button onClick={() => void connect()} disabled={!configured || pending}>
				{pending
					? t("connections.slack.connectButton.openingSlack")
					: configured
						? t("connections.slack.connectButton.connectSlack")
						: t("connections.slack.connectButton.notConfigured")}
			</Button>
			{connectError ? (
				<p role="alert" className="max-w-sm text-destructive text-xs">
					{connectErrorMessage(t, connectError)}
				</p>
			) : null}
		</div>
	);
}
