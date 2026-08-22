"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@crm/ui/components/card";
import { Label } from "@crm/ui/components/label";
import { Switch } from "@crm/ui/components/switch";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";

type SettingsTranslator = ReturnType<typeof useTranslations<"settings">>;

function rules(t: SettingsTranslator) {
	return [
		{
			flag: "crossDomain",
			label: t("tracking.rules.crossDomain.label"),
			hint: t("tracking.rules.crossDomain.hint"),
		},
		{
			flag: "limitToDomains",
			label: t("tracking.rules.limitToDomains.label"),
			hint: t("tracking.rules.limitToDomains.hint"),
		},
	] as const;
}

export function TrackingRules() {
	const t = useTranslations("settings");
	const trpc = useTRPC();
	const cache = useCrmCache();

	const tracking = useQuery(trpc.tracking.settings.queryOptions());

	const setFlag = useMutation(
		trpc.tracking.setFlag.mutationOptions({
			onSuccess: () => cache.tracking({ settle: "record" }),
			onError: (error) => toast.error(error.message),
		}),
	);

	if (!tracking.data) return null;

	const { canManage } = tracking.data;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("tracking.rules.title")}</CardTitle>
				<CardDescription>{t("tracking.rules.description")}</CardDescription>
			</CardHeader>

			<CardContent>
				{rules(t).map((rule) => (
					<div
						key={rule.flag}
						className="flex items-center justify-between gap-6"
					>
						<Label
							htmlFor={`tracking-${rule.flag}`}
							className="flex flex-col items-start gap-1"
						>
							<span className="text-sm">{rule.label}</span>
							<span className="font-normal text-muted-foreground text-xs">
								{rule.hint}
							</span>
						</Label>

						<Switch
							id={`tracking-${rule.flag}`}
							checked={tracking.data[rule.flag]}
							disabled={!canManage || setFlag.isPending}
							onCheckedChange={(enabled) =>
								setFlag.mutate({ flag: rule.flag, enabled })
							}
						/>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
