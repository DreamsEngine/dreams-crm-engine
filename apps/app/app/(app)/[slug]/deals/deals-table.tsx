"use client";

import {
	DataTable,
	type DataTableColumn,
	type DataTableFacet,
} from "@crm/ui/components/data-table";
import { EmptyCellValue } from "@crm/ui/components/empty-cell";
import { useTableSelection } from "@crm/ui/hooks/use-table-selection";
import { formatMoney } from "@crm/ui/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { CLOSING_OPTIONS } from "@/components/crm/closing-window";
import { CompanyCell } from "@/components/crm/company-cell";
import { useFieldColumns } from "@/components/crm/fields/field-columns";
import { OwnerCell } from "@/components/crm/owner-cell";
import { usePrefetchRecord } from "@/components/crm/record-sheet/record-prefetch";
import { useOpenRecord } from "@/components/crm/record-sheet/record-stack";
import { DealStageMenu } from "@/components/crm/stage-change";
import { ListSearch } from "@/components/data-table/list-search";
import { useTableQuery } from "@/components/data-table/use-table-query";
import { LocalDay, LocalRelativeTime } from "@/components/local-date-time";
import { DEAL_STAGE_OPTIONS } from "@/lib/deal-stage";
import { useTRPC } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";
import { DealsBulkActions } from "./deals-bulk-actions";
import { dealsSearchParams } from "./deals-search-params";

type DealRow = RouterOutputs["deals"]["list"]["rows"][number];

function columns(
	t: ReturnType<typeof useTranslations>,
): DataTableColumn<DealRow>[] {
	return [
		{
			id: "name",
			header: t("table.columns.deal"),
			sortable: true,
			hideable: false,
			width: "w-[24%]",
			cell: (row) => <span className="truncate font-medium">{row.name}</span>,
		},
		{
			id: "company",
			header: t("table.columns.company"),
			sortable: true,
			width: "w-[18%]",
			cell: (row) => <CompanyCell company={row.company} />,
		},
		{
			id: "stage",
			header: t("table.columns.stage"),
			sortable: true,
			width: "w-[18%]",
			cell: (row) => <DealStageMenu dealId={row.id} stage={row.stage} />,
		},
		{
			id: "amount",
			header: t("table.columns.amount"),
			sortable: true,
			align: "right",
			width: "w-[12%]",
			hideBelow: "sm",
			cell: (row) =>
				row.amountCents === null ? (
					<EmptyCellValue />
				) : (
					<span className="tabular-nums">
						{formatMoney(row.amountCents, row.currency)}
					</span>
				),
		},
		{
			id: "owner",
			header: t("table.columns.owner"),
			sortable: true,
			width: "w-[14%]",
			hideBelow: "md",
			cell: (row) => <OwnerCell owner={row.owner} />,
		},
		{
			id: "expectedCloseDate",
			header: t("table.columns.closeDate"),
			sortable: true,
			width: "w-[12%]",
			hideBelow: "lg",
			cell: (row) =>
				row.expectedCloseDate ? (
					<span className="text-muted-foreground">
						<LocalDay date={row.expectedCloseDate} />
					</span>
				) : (
					<EmptyCellValue />
				),
		},
		{
			id: "createdAt",
			header: t("table.columns.created"),
			label: t("table.columns.createdLabel"),
			sortable: true,
			align: "right",
			width: "w-[10%]",
			defaultHidden: true,
			cell: (row) => (
				<span className="text-muted-foreground">
					<LocalRelativeTime date={row.createdAt} />
				</span>
			),
		},
		{
			id: "lastActivity",
			header: t("table.columns.lastActivity"),
			sortable: true,
			align: "right",
			width: "w-[12%]",
			hideBelow: "lg",
			cell: (row) => (
				<span className="text-muted-foreground">
					{row.lastActivityAt ? (
						<LocalRelativeTime date={row.lastActivityAt} />
					) : (
						<EmptyCellValue />
					)}
				</span>
			),
		},
	];
}

export function DealsTable() {
	const t = useTranslations("deals");
	const openRecord = useOpenRecord();
	const trpc = useTRPC();
	const prefetchRecord = usePrefetchRecord();
	const { query, input } = useTableQuery(dealsSearchParams);

	const deals = useQuery({
		...trpc.deals.list.queryOptions(input),
		placeholderData: (previous) => previous,
	});
	const users = useQuery(trpc.users.list.queryOptions());

	const rows = deals.data?.rows ?? [];
	const selection = useTableSelection(
		useMemo(() => rows.map((row) => row.id), [rows]),
	);

	const facetCounts = deals.data?.facetCounts;

	const facets: DataTableFacet[] = [
		{
			id: "owner",
			label: t("table.facets.owner"),
			options: (users.data ?? []).flatMap((user) =>
				(facetCounts?.owner?.[user.id] ?? 0) > 0
					? [{ value: user.id, label: user.name }]
					: [],
			),
		},
		{
			id: "stage",
			label: t("table.facets.stage"),
			options: DEAL_STAGE_OPTIONS.filter(
				(option) => (facetCounts?.stage?.[option.value] ?? 0) > 0,
			).map((option) => ({
				...option,
				label: t(`stages.${option.value}`),
			})),
		},
		{
			id: "closing",
			label: t("table.facets.closing"),
			options: CLOSING_OPTIONS.flatMap((option) =>
				(facetCounts?.closing?.[option.value] ?? 0) > 0
					? [{ value: option.value, label: option.label }]
					: [],
			),
		},
	];

	const openValueCents = deals.data?.openValueCents;
	const reportingCurrency = deals.data?.reportingCurrency;
	const unconverted = deals.data?.unconverted;
	const uncounted = unconverted?.count ?? 0;
	const openPipelineCents = openValueCents ?? (uncounted > 0 ? 0 : null);

	const fieldColumns = useFieldColumns<DealRow>("DEAL");
	const tableColumns = useMemo(
		() => [...columns(t), ...fieldColumns],
		[t, fieldColumns],
	);

	return (
		<DataTable
			query={query}
			search={<ListSearch placeholder={t("table.searchPlaceholder")} />}
			columns={tableColumns}
			rows={rows}
			total={deals.data?.total ?? 0}
			facetCounts={facetCounts}
			facets={facets}
			tabs={{
				id: "status",
				allLabel: t("table.tabs.all"),
				options: [
					{ value: "open", label: t("table.tabs.open") },
					{ value: "closed", label: t("table.tabs.closed") },
				],
			}}
			selection={{
				state: selection,
				actions: (
					<DealsBulkActions ids={selection.ids} onDone={selection.clear} />
				),
				rowLabel: (row) => row.name,
			}}
			getRowId={(row) => row.id}
			loading={deals.isFetching}
			onRowHover={(row) => prefetchRecord({ kind: "deal", id: row.id })}
			onRowClick={(row) => openRecord({ kind: "deal", id: row.id })}
			empty={t("table.empty")}
			meta={
				openPipelineCents === null ? undefined : (
					<span>
						{t.rich("table.meta", {
							count: deals.data?.total ?? 0,
							amount: formatMoney(openPipelineCents, reportingCurrency),
							money: (chunks) => <span className="tabular-nums">{chunks}</span>,
						})}
						{unconverted && unconverted.count > 0 ? (
							<span className="text-muted-foreground">
								{t("table.metaUnconverted", {
									count: unconverted.count,
									currencies: unconverted.currencies.join(", "),
								})}
							</span>
						) : null}
					</span>
				)
			}
		/>
	);
}
