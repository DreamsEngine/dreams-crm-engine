"use client";

import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { PageShellDescription, PageShellTitle } from "@/components/page-shell";
import { overviewParsers } from "./overview-search-params";

export function OverviewGreetingFallback() {
	const t = useTranslations("overview");

	return (
		<>
			<PageShellTitle>{t("greeting.title")}</PageShellTitle>
			<PageShellDescription>
				{t("greeting.descriptionMine")}
			</PageShellDescription>
		</>
	);
}

export function OverviewGreeting() {
	const t = useTranslations("overview");
	const [scope] = useQueryState("scope", overviewParsers.scope);

	return (
		<>
			<PageShellTitle>{t("greeting.title")}</PageShellTitle>
			<PageShellDescription>
				{scope === "me"
					? t("greeting.descriptionMine")
					: t("greeting.descriptionEveryone")}
			</PageShellDescription>
		</>
	);
}
