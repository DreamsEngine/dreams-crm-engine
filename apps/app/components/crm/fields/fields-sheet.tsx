"use client";

import { Spinner } from "@crm/ui/components/spinner";
import { Tabs, TabsList, TabsTrigger } from "@crm/ui/components/tabs";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
	type RecordKind,
	useFieldsSheet,
} from "@/components/crm/record-sheet/record-stack";
import { DetailSheet, DetailSheetHeader } from "@/components/detail-sheet";
import { useTRPC } from "@/lib/trpc/client";
import { FieldEditor } from "./field-editor";
import { entityOf } from "./fields-entity";
import { FieldsList } from "./fields-list";

const ENTITY_TABS = [
	{ kind: "company", labelKey: "quickSwitcher.companies" },
	{ kind: "contact", labelKey: "quickSwitcher.contacts" },
	{ kind: "deal", labelKey: "quickSwitcher.deals" },
] as const satisfies readonly { kind: RecordKind; labelKey: string }[];

function FieldsSheetBody({
	kind,
	field,
	onEntity,
	onEdit,
	onClose,
}: {
	kind: RecordKind;
	field: string | null;
	onEntity: (kind: RecordKind) => void;
	onEdit: (key: string | null) => void;
	onClose: () => void;
}) {
	const t = useTranslations("record");
	const trpc = useTRPC();
	const entity = entityOf(kind);

	const query = useQuery(
		trpc.fields.list.queryOptions({ entity, includeArchived: true }),
	);

	const editingKey = field && field !== "new" ? field : null;
	const editing = editingKey
		? query.data?.find((entry) => entry.key === editingKey)
		: undefined;

	const coverage = useQuery({
		...trpc.fields.coverage.queryOptions({ id: editing?.id ?? "" }),
		enabled: Boolean(editing?.agentFilled),
	});

	if (field) {
		const tab = ENTITY_TABS.find((tab) => tab.kind === kind);
		const entityLabel = tab ? t(tab.labelKey) : undefined;
		const filled = coverage.data;

		return (
			<>
				<DetailSheetHeader
					title={editing?.label ?? (editingKey ? "" : t("fields.newField"))}
					description={
						filled
							? t("fields.coverageDescription", {
									entity: entityLabel ?? "",
									filled: filled.filled,
									total: filled.total,
								})
							: entityLabel
					}
					onBack={() => onEdit(null)}
					onClose={onClose}
				/>
				{editingKey && query.isPending ? (
					<div className="flex min-h-0 flex-1 items-center justify-center">
						<Spinner />
					</div>
				) : (
					<FieldEditor
						key={editing?.id ?? "new"}
						entity={entity}
						field={editing}
						onDone={() => onEdit(null)}
					/>
				)}
			</>
		);
	}

	return (
		<>
			<DetailSheetHeader
				title={t("fields.sheetTitle")}
				description={t("fields.subtitle", { kind })}
				onClose={onClose}
				note={
					<Tabs
						value={kind}
						onValueChange={(next) => onEntity(next as RecordKind)}
					>
						<TabsList>
							{ENTITY_TABS.map((tab) => (
								<TabsTrigger key={tab.kind} value={tab.kind}>
									{t(tab.labelKey)}
								</TabsTrigger>
							))}
						</TabsList>
					</Tabs>
				}
			/>
			<FieldsList
				entity={entity}
				onEdit={(key) => onEdit(key)}
				onNew={() => onEdit("new")}
			/>
		</>
	);
}

export function FieldsSheetHost() {
	const { entity, field, open, close, edit } = useFieldsSheet();

	return (
		<DetailSheet
			open={entity !== null}
			size="md"
			onOpenChange={(next) => {
				if (!next) close();
			}}
		>
			{entity ? (
				<FieldsSheetBody
					kind={entity}
					field={field}
					onEntity={open}
					onEdit={edit}
					onClose={close}
				/>
			) : null}
		</DetailSheet>
	);
}
