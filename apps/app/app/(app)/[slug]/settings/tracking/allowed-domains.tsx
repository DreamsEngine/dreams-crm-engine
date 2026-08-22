"use client";

import Add from "@carbon/icons-react/es/Add";
import { Button } from "@crm/ui/components/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@crm/ui/components/card";
import { CardTableEmpty } from "@crm/ui/components/card-table";
import { Field, FieldLabel } from "@crm/ui/components/field";
import { Icon } from "@crm/ui/components/icon";
import { Input } from "@crm/ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@crm/ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@crm/ui/components/select";
import {
	SimpleTable,
	type SimpleTableColumn,
	SimpleTableRow,
} from "@crm/ui/components/simple-table";
import { Spinner } from "@crm/ui/components/spinner";
import { TableCell } from "@crm/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { LocalRelativeTime } from "@/components/local-date-time";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";

const CELL = "px-3 py-2.5 align-middle";

type SettingsTranslator = ReturnType<typeof useTranslations<"settings">>;

type Scope = "SITE_AND_SUBDOMAINS" | "EXACT_HOST";

function scopeLabels(t: SettingsTranslator): Record<Scope, string> {
	return {
		SITE_AND_SUBDOMAINS: t("tracking.domains.scopeSiteAndSubdomains"),
		EXACT_HOST: t("tracking.domains.scopeExactHost"),
	};
}

export function AllowedDomains() {
	const t = useTranslations("settings");
	const trpc = useTRPC();
	const cache = useCrmCache();

	const scopeLabel = scopeLabels(t);

	const COLUMNS: SimpleTableColumn[] = [
		{ id: "domain", header: t("tracking.domains.columns.domain") },
		{ id: "scope", header: t("tracking.domains.columns.scope"), width: "w-40" },
		{
			id: "pageViews",
			header: t("tracking.domains.columns.pageViews"),
			width: "w-28",
			align: "right",
		},
		{
			id: "lastSeen",
			header: t("tracking.domains.columns.lastSeen"),
			width: "w-28",
			align: "right",
		},
		{
			id: "actions",
			srLabel: t("tracking.domains.columns.actions"),
			width: "w-24",
		},
	];

	const tracking = useQuery(trpc.tracking.settings.queryOptions());

	const remove = useMutation(
		trpc.tracking.removeDomain.mutationOptions({
			onSuccess: async () => {
				await cache.tracking();
				toast.success(t("tracking.domains.removed"));
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	if (!tracking.data) return null;

	const { domains, canManage } = tracking.data;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("tracking.domains.title")}</CardTitle>
				<CardDescription>{t("tracking.domains.description")}</CardDescription>

				<CardAction>
					<AddDomain disabled={!canManage} />
				</CardAction>
			</CardHeader>

			{domains.length === 0 ? (
				<CardTableEmpty>{t("tracking.domains.empty")}</CardTableEmpty>
			) : (
				<SimpleTable columns={COLUMNS}>
					{domains.map((domain) => (
						<SimpleTableRow key={domain.id}>
							<TableCell className={CELL}>
								<span className="font-mono">{domain.host}</span>
							</TableCell>
							<TableCell className={`${CELL} text-muted-foreground`}>
								{scopeLabel[domain.scope]}
							</TableCell>
							<TableCell className={`${CELL} text-right tabular-nums`}>
								{domain.pageViews.toLocaleString()}
							</TableCell>
							<TableCell className={`${CELL} text-right text-muted-foreground`}>
								{domain.lastSeenAt ? (
									<LocalRelativeTime date={domain.lastSeenAt} />
								) : (
									"—"
								)}
							</TableCell>
							<TableCell className={`${CELL} text-right`}>
								{canManage ? (
									<Button
										variant="ghost"
										size="sm"
										disabled={remove.isPending}
										onClick={() => remove.mutate({ id: domain.id })}
									>
										{t("common.remove")}
									</Button>
								) : null}
							</TableCell>
						</SimpleTableRow>
					))}
				</SimpleTable>
			)}
		</Card>
	);
}

function AddDomain({ disabled }: { disabled: boolean }) {
	const t = useTranslations("settings");
	const trpc = useTRPC();
	const cache = useCrmCache();

	const scopeLabel = scopeLabels(t);

	const hostId = useId();
	const scopeId = useId();

	const [open, setOpen] = useState(false);
	const [host, setHost] = useState("");
	const [scope, setScope] = useState<Scope>("SITE_AND_SUBDOMAINS");

	const add = useMutation(
		trpc.tracking.addDomain.mutationOptions({
			onSuccess: async () => {
				await cache.tracking();
				setOpen(false);
				setHost("");
				toast.success(t("tracking.domains.added"));
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button size="sm" disabled={disabled}>
					<Icon icon={Add} data-icon="inline-start" />
					{t("tracking.domains.addButton")}
				</Button>
			</PopoverTrigger>

			<PopoverContent align="end" className="w-80">
				<form
					className="flex flex-col gap-4"
					onSubmit={(event) => {
						event.preventDefault();
						add.mutate({ host: host.trim(), scope });
					}}
				>
					<Field>
						<FieldLabel htmlFor={hostId}>
							{t("tracking.domains.hostLabel")}
						</FieldLabel>
						<Input
							id={hostId}
							value={host}
							onChange={(event) => setHost(event.target.value)}
							placeholder={t("tracking.domains.hostPlaceholder")}
							autoComplete="off"
							autoCapitalize="off"
							autoCorrect="off"
							spellCheck={false}
						/>
					</Field>

					<Field>
						<FieldLabel htmlFor={scopeId}>
							{t("tracking.domains.scopeLabel")}
						</FieldLabel>
						<Select
							value={scope}
							onValueChange={(next) => setScope(next as Scope)}
						>
							<SelectTrigger id={scopeId} className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{(Object.keys(scopeLabel) as Scope[]).map((value) => (
									<SelectItem key={value} value={value}>
										{scopeLabel[value]}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</Field>

					<Button type="submit" disabled={add.isPending || host.trim() === ""}>
						{add.isPending ? <Spinner data-icon="inline-start" /> : null}
						{t("tracking.domains.addButton")}
					</Button>
				</form>
			</PopoverContent>
		</Popover>
	);
}
