import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AuthHeading, AuthShell } from "@/components/auth-shell";
import { requireMailboxAccess } from "@/lib/session";
import { ResearchForm } from "./research-form";

export const metadata: Metadata = {
	title: "Research key",
};

export const instant = false;

export default async function ResearchKeyPage() {
	await requireMailboxAccess();

	const t = await getTranslations("onboarding");

	return (
		<AuthShell>
			<AuthHeading
				title={t("researchPage.title")}
				description={t("researchPage.description")}
			/>

			<ResearchForm />
		</AuthShell>
	);
}
