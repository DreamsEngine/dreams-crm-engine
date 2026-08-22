"use client";

import {
	DataTable,
	type DataTableColumn,
	type DataTableFacet,
} from "@crm/ui/components/data-table";
import { EmptyCellValue } from "@crm/ui/components/empty-cell";
import { PersonAvatar } from "@crm/ui/components/person-avatar";
import { useSearchInput } from "@crm/ui/hooks/use-search-input";
import { useTableSelection } from "@crm/ui/hooks/use-table-selection";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { CompanyCell } from "@/components/crm/company-cell";
import { contactName } from "@/components/crm/contact-name";
import { useFieldColumns } from "@/components/crm/fields/field-columns";
import { OwnerCell } from "@/components/crm/owner-cell";
import { usePrefetchRecord } from "@/components/crm/record-sheet/record-prefetch";
import { useOpenRecord } from "@/components/crm/record-sheet/record-stack";
import { ListSearch } from "@/components/data-table/list-search";
import { useTableQuery } from "@/components/data-table/use-table-query";
import { LocalRelativeTime } from "@/components/local-date-time";
import { useTRPC } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";
import { ContactsBulkActions } from "./contacts-bulk-actions";
import { contactsSearchParams } from "./contacts-search-params";

type ContactRow = RouterOutputs["contacts"]["list"]["rows"][number];

function columns(
	t: ReturnType<typeof useTranslations>,
): DataTableColumn<ContactRow>[] {
	return [
		{
			id: "name",
			header: t("table.columns.name"),
			sortable: true,
			hideable: false,
			width: "w-[22%]",
			cell: (row) => (
				<span className="flex min-w-0 items-center gap-2">
					<PersonAvatar
						src={row.imageUrl}
						name={contactName(row)}
						email={row.email}
						size="sm"
					/>
					<span className="truncate font-medium">{contactName(row)}</span>
				</span>
			),
		},
		{
			id: "title",
			header: t("table.columns.title"),
			sortable: true,
			width: "w-[20%]",
			hideBelow: "lg",
			cell: (row) =>
				row.title ? (
					<span className="truncate">{row.title}</span>
				) : (
					<EmptyCellValue />
				),
		},
		{
			id: "email",
			header: t("table.columns.email"),
			sortable: true,
			width: "w-[24%]",
			hideBelow: "md",
			cell: (row) =>
				row.email ? (
					<span className="truncate text-muted-foreground">{row.email}</span>
				) : (
					<EmptyCellValue />
				),
		},
		{
			id: "company",
			header: t("table.columns.company"),
			sortable: true,
			width: "w-[18%]",
			cell: (row) => <CompanyCell company={row.company} />,
		},
		{
			id: "owner",
			header: t("table.columns.owner"),
			sortable: true,
			width: "w-[16%]",
			hideBelow: "md",
			cell: (row) => <OwnerCell owner={row.owner} />,
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
			hideBelow: "sm",
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

export function ContactsTable() {
	const t = useTranslations("contacts");
	const openRecord = useOpenRecord();
	const trpc = useTRPC();
	const prefetchRecord = usePrefetchRecord();
	const { query, input } = useTableQuery(contactsSearchParams);

	const contacts = useQuery({
		...trpc.contacts.list.queryOptions(input),
		placeholderData: (previous) => previous,
	});
	const users = useQuery(trpc.users.list.queryOptions());

	const [companyQuery, setCompanyQuery] = useState("");
	const [companyText, setCompanyText] = useSearchInput(
		companyQuery,
		setCompanyQuery,
	);
	const companies = useQuery({
		...trpc.companies.options.queryOptions({ q: companyQuery }),
		placeholderData: (previous) => previous,
	});

	const rows = contacts.data?.rows ?? [];
	const selection = useTableSelection(
		useMemo(() => rows.map((row) => row.id), [rows]),
	);

	const facetCounts = contacts.data?.facetCounts;

	const facets: DataTableFacet[] = [
		{
			id: "owner",
			label: t("table.facets.owner"),
			options: [
				{ value: "unassigned", label: t("table.facets.unassigned") },
				...(users.data ?? []).map((user) => ({
					value: user.id,
					label: user.name,
				})),
			].filter((option) => (facetCounts?.owner?.[option.value] ?? 0) > 0),
		},
		{
			id: "company",
			label: t("table.facets.company"),
			searchable: true,
			search: companyText,
			onSearchChange: setCompanyText,
			stale: companies.isFetching || companyText.trim() !== companyQuery.trim(),
			empty: companies.isFetching
				? t("table.facets.searching")
				: t("table.facets.noCompanyMatch"),
			options: [
				...(companyQuery.trim()
					? []
					: [{ value: "none", label: t("table.facets.noCompany") }]),
				...(companies.data ?? []).map((company) => ({
					value: company.id,
					label: company.name,
				})),
			].filter((option) => (facetCounts?.company?.[option.value] ?? 0) > 0),
		},
	];

	const fieldColumns = useFieldColumns<ContactRow>("CONTACT");
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
			total={contacts.data?.total ?? 0}
			facetCounts={facetCounts}
			facets={facets}
			selection={{
				state: selection,
				actions: (
					<ContactsBulkActions ids={selection.ids} onDone={selection.clear} />
				),
				rowLabel: (row) => contactName(row),
			}}
			getRowId={(row) => row.id}
			loading={contacts.isFetching}
			onRowHover={(row) => prefetchRecord({ kind: "contact", id: row.id })}
			onRowClick={(row) => openRecord({ kind: "contact", id: row.id })}
			empty={t("table.empty")}
		/>
	);
}
