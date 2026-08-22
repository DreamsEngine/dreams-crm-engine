"use client";

import { CURRENCIES } from "@crm/db/currency";
import { Button } from "@crm/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@crm/ui/components/card";
import { CardTableEmpty } from "@crm/ui/components/card-table";
import { Field, FieldDescription, FieldLabel } from "@crm/ui/components/field";
import { Input } from "@crm/ui/components/input";
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
import { StatusIndicator } from "@crm/ui/components/status-indicator";
import { TableCell } from "@crm/ui/components/table";
import { formatCount } from "@crm/ui/lib/format";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { LocalRelativeTime } from "@/components/local-date-time";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";

const CELL = "px-3 py-2.5 align-middle";

export function CurrencySettings() {
	const t = useTranslations("settings");

	const RATE_COLUMNS: SimpleTableColumn[] = [
		{ id: "currency", header: t("currencies.columns.currency") },
		{
			id: "rate",
			header: t("currencies.columns.rate"),
			width: "w-32",
			align: "right",
		},
		{ id: "source", header: t("currencies.columns.source"), width: "w-28" },
		{
			id: "asOf",
			header: t("currencies.columns.asOf"),
			width: "w-24",
			align: "right",
		},
		{ id: "actions", srLabel: t("currencies.columns.actions"), width: "w-20" },
	];

	const USAGE_COLUMNS: SimpleTableColumn[] = [
		{ id: "currency", header: t("currencies.columns.currency") },
		{
			id: "deals",
			header: t("currencies.columns.deals"),
			width: "w-20",
			align: "right",
		},
		{
			id: "convertible",
			header: t("currencies.columns.convertible"),
			width: "w-32",
			align: "right",
		},
	];

	const trpc = useTRPC();
	const cache = useCrmCache();

	const baseId = useId();
	const rateCurrencyId = useId();
	const rateValueId = useId();

	const [draftCurrency, setDraftCurrency] = useState("");
	const [draftRate, setDraftRate] = useState("");

	const settings = useQuery(trpc.currency.settings.queryOptions());

	const invalidate = () => cache.currency();

	const setBase = useMutation(
		trpc.currency.setReportingCurrency.mutationOptions({
			onSuccess: async (next) => {
				await invalidate();
				toast.success(
					t("currencies.reporting.saved", {
						currency: next.reportingCurrency,
					}),
				);
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const setRate = useMutation(
		trpc.currency.setManualRate.mutationOptions({
			onSuccess: async () => {
				await invalidate();
				setDraftCurrency("");
				setDraftRate("");
				toast.success(t("currencies.rates.saved"));
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const removeRate = useMutation(
		trpc.currency.removeManualRate.mutationOptions({
			onSuccess: async () => {
				await invalidate();
				toast.success(t("currencies.rates.removed"));
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	const refresh = useMutation(
		trpc.currency.refreshRates.mutationOptions({
			onSuccess: async () => {
				await invalidate();
				toast.success(t("currencies.rates.refreshed"));
			},
			onError: (error) => toast.error(error.message),
		}),
	);

	if (!settings.data) return null;

	const {
		reportingCurrency,
		refreshedAt,
		rates,
		inUse,
		unconverted,
		canManage,
	} = settings.data;

	const busy =
		!canManage ||
		setBase.isPending ||
		setRate.isPending ||
		removeRate.isPending ||
		refresh.isPending;

	return (
		<div className="flex flex-col gap-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("currencies.reporting.title")}</CardTitle>
					<CardDescription>
						{t("currencies.reporting.description")}
					</CardDescription>
				</CardHeader>

				<CardContent>
					<Field>
						<FieldLabel htmlFor={baseId}>
							{t("currencies.reporting.fieldLabel")}
						</FieldLabel>
						<Select
							value={reportingCurrency}
							disabled={busy}
							onValueChange={(currency) => setBase.mutate({ currency })}
						>
							<SelectTrigger id={baseId} className="w-full max-w-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{CURRENCIES.map((entry) => (
									<SelectItem key={entry.code} value={entry.code}>
										{entry.code} · {entry.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FieldDescription>
							{canManage
								? t("currencies.reporting.hintManage")
								: t("currencies.reporting.hintRestricted")}
						</FieldDescription>
					</Field>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{t("currencies.rates.title")}</CardTitle>
					<CardDescription>
						{t("currencies.rates.description", { currency: reportingCurrency })}
					</CardDescription>
					<CardAction>
						<Button
							variant="contrast"
							size="sm"
							disabled={busy}
							onClick={() => refresh.mutate()}
						>
							{refresh.isPending ? <Spinner data-icon="inline-start" /> : null}
							{t("currencies.rates.refresh")}
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent>
					<form
						className="flex flex-wrap items-end gap-3"
						onSubmit={(event) => {
							event.preventDefault();
							const rate = Number.parseFloat(draftRate);
							if (!Number.isFinite(rate) || rate <= 0) {
								toast.error(t("currencies.rates.invalidRate"));
								return;
							}
							setRate.mutate({ currency: draftCurrency, rate });
						}}
					>
						<Field className="w-48">
							<FieldLabel htmlFor={rateCurrencyId}>
								{t("currencies.rates.currencyLabel")}
							</FieldLabel>
							<Select
								value={draftCurrency}
								disabled={busy}
								onValueChange={setDraftCurrency}
							>
								<SelectTrigger id={rateCurrencyId} className="w-full">
									<SelectValue
										placeholder={t("currencies.rates.currencyPlaceholder")}
									/>
								</SelectTrigger>
								<SelectContent>
									{CURRENCIES.filter(
										(entry) => entry.code !== reportingCurrency,
									).map((entry) => (
										<SelectItem key={entry.code} value={entry.code}>
											{entry.code} · {entry.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>

						<Field className="w-48">
							<FieldLabel htmlFor={rateValueId}>
								{t("currencies.rates.valueLabel", {
									currency: draftCurrency || t("currencies.rates.valueUnit"),
									reporting: reportingCurrency,
								})}
							</FieldLabel>
							<Input
								id={rateValueId}
								value={draftRate}
								inputMode="decimal"
								placeholder={t("currencies.rates.ratePlaceholder")}
								disabled={busy}
								onChange={(event) => setDraftRate(event.target.value)}
							/>
						</Field>

						<Button
							type="submit"
							disabled={busy || draftCurrency === "" || draftRate.trim() === ""}
						>
							{setRate.isPending ? <Spinner data-icon="inline-start" /> : null}
							{t("currencies.rates.saveRate")}
						</Button>
					</form>
				</CardContent>

				{rates.length === 0 ? (
					<CardTableEmpty>{t("currencies.rates.empty")}</CardTableEmpty>
				) : (
					<SimpleTable columns={RATE_COLUMNS}>
						{rates.map((rate) => (
							<SimpleTableRow key={rate.currency}>
								<TableCell className={CELL}>
									<span className="font-medium">{rate.currency}</span>
									<span className="text-muted-foreground">
										{rate.name ? ` · ${rate.name}` : ""}
									</span>
								</TableCell>
								<TableCell className={`${CELL} text-right tabular-nums`}>
									{rate.rate}
								</TableCell>
								<TableCell className={CELL}>
									<StatusIndicator
										size="sm"
										tone={rate.source === "MANUAL" ? "warning" : "success"}
										label={
											rate.source === "MANUAL"
												? t("currencies.rates.sourceManual")
												: t("currencies.rates.sourceFetched")
										}
									/>
								</TableCell>
								<TableCell
									className={`${CELL} text-right text-muted-foreground`}
								>
									<LocalRelativeTime date={rate.asOf} />
								</TableCell>
								<TableCell className={`${CELL} text-right`}>
									{rate.source === "MANUAL" ? (
										<Button
											variant="ghost"
											size="sm"
											disabled={busy}
											onClick={() =>
												removeRate.mutate({ currency: rate.currency })
											}
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

			<Card>
				<CardHeader>
					<CardTitle>{t("currencies.inUse.title")}</CardTitle>
					<CardDescription>
						{unconverted.count === 0
							? t("currencies.inUse.allConvertible")
							: t("currencies.inUse.someUnconvertible", {
									count: unconverted.count,
									deals: formatCount(unconverted.count, "deal"),
								})}
						{refreshedAt ? (
							<>
								{" "}
								{t.rich("currencies.inUse.ratesLastFetched", {
									time: () => <LocalRelativeTime date={refreshedAt} />,
								})}
							</>
						) : null}
					</CardDescription>
				</CardHeader>

				{inUse.length === 0 ? (
					<CardTableEmpty>{t("currencies.inUse.noDeals")}</CardTableEmpty>
				) : (
					<SimpleTable columns={USAGE_COLUMNS}>
						{inUse.map((row) => (
							<SimpleTableRow key={row.currency}>
								<TableCell className={CELL}>
									<span className="font-medium">{row.currency}</span>
									<span className="text-muted-foreground">
										{row.name ? ` · ${row.name}` : ""}
									</span>
									{row.currency === reportingCurrency ? (
										<span className="text-muted-foreground">
											{" · "}
											{t("currencies.inUse.reportingCurrencyNote")}
										</span>
									) : null}
								</TableCell>
								<TableCell className={`${CELL} text-right tabular-nums`}>
									{row.deals}
								</TableCell>
								<TableCell className={`${CELL} text-right`}>
									{row.convertible ? (
										<StatusIndicator
											size="sm"
											tone="success"
											label={t("currencies.inUse.yes")}
										/>
									) : (
										<StatusIndicator
											size="sm"
											tone="error"
											label={t("currencies.inUse.noRate")}
										/>
									)}
								</TableCell>
							</SimpleTableRow>
						))}
					</SimpleTable>
				)}
			</Card>
		</div>
	);
}
