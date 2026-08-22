import { DEFAULT_WORKSPACE_NAME } from "@crm/auth";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthHeading, AuthShell } from "@/components/auth-shell";
import { requireMailboxAccess } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = {
	title: "Set up",
};

export const instant = false;

export default async function OnboardingPage() {
	await requireMailboxAccess();

	const t = await getTranslations("onboarding");

	return (
		<AuthShell>
			<AuthHeading
				title={t("page.title")}
				description={t("page.description")}
			/>

			<OnboardingForm placeholder={DEFAULT_WORKSPACE_NAME} />
		</AuthShell>
	);
}
