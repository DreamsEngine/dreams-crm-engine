"use client";

import { ToggleGroup, ToggleGroupItem } from "@crm/ui/components/toggle-group";
import { useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import {
	OVERVIEW_SCOPES,
	type OverviewScope,
	overviewParsers,
} from "./overview-search-params";

function isScope(value: string): value is OverviewScope {
	return (OVERVIEW_SCOPES as readonly string[]).includes(value);
}

export function OverviewScopeToggleFallback() {
	const t = useTranslations("overview");
	const labels = {
		me: t("scopeToggle.me"),
		everyone: t("scopeToggle.everyone"),
	} satisfies Record<OverviewScope, string>;

	return (
		<ToggleGroup
			type="single"
			variant="outline"
			size="sm"
			spacing={0}
			disabled
			aria-label={t("scopeToggle.ariaLabel")}
		>
			{OVERVIEW_SCOPES.map((value) => (
				<ToggleGroupItem key={value} value={value}>
					{labels[value]}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}

export function OverviewScopeToggle() {
	const t = useTranslations("overview");
	const labels = {
		me: t("scopeToggle.me"),
		everyone: t("scopeToggle.everyone"),
	} satisfies Record<OverviewScope, string>;
	const [scope, setScope] = useQueryState("scope", overviewParsers.scope);

	return (
		<ToggleGroup
			type="single"
			variant="outline"
			size="sm"
			spacing={0}
			value={scope}
			onValueChange={(next) => {
				if (isScope(next)) void setScope(next);
			}}
			aria-label={t("scopeToggle.ariaLabel")}
		>
			{OVERVIEW_SCOPES.map((value) => (
				<ToggleGroupItem key={value} value={value}>
					{labels[value]}
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
