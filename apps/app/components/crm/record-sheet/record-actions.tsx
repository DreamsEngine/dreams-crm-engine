"use client";

import OverflowMenuVertical from "@carbon/icons-react/es/OverflowMenuVertical";
import TrashCan from "@carbon/icons-react/es/TrashCan";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@crm/ui/components/alert-dialog";
import { Button } from "@crm/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@crm/ui/components/dropdown-menu";
import { Icon } from "@crm/ui/components/icon";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";
import { type RecordRef, useRecordStack } from "./record-stack";

type Translate = (key: string, values?: Record<string, string>) => string;

function useDeleteRecord(record: RecordRef, t: Translate) {
	const trpc = useTRPC();
	const cache = useCrmCache();
	const { close } = useRecordStack();

	const handlers = {
		onSuccess: (deleted: { name: string }) => {
			toast.success(
				deleted.name
					? t("sheet.recordDeletedNamed", { name: deleted.name })
					: t("sheet.recordDeletedGeneric", { kind: record.kind }),
			);
			void cache.removed(record);
			close();
		},
		onError: (error: { message: string }) => toast.error(error.message),
	};

	const options =
		record.kind === "contact"
			? trpc.contacts.delete.mutationOptions(handlers)
			: record.kind === "company"
				? trpc.companies.delete.mutationOptions(handlers)
				: trpc.deals.delete.mutationOptions(handlers);

	return useMutation(options);
}

export function RecordActions({
	record,
	name,
	consequence,
}: {
	record: RecordRef;
	name: string;
	consequence: string;
}) {
	const t = useTranslations("record");
	const [confirming, setConfirming] = useState(false);
	const remove = useDeleteRecord(record, t);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon-sm" disabled={remove.isPending}>
						<Icon icon={OverflowMenuVertical} />
						<span className="sr-only">{t("sheet.moreActions")}</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="min-w-44">
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setConfirming(true)}
					>
						<Icon icon={TrashCan} />
						{t("sheet.deleteKind", { kind: record.kind })}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<AlertDialog open={confirming} onOpenChange={setConfirming}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("sheet.deleteDialogTitle", { name })}
						</AlertDialogTitle>
						<AlertDialogDescription>{consequence}</AlertDialogDescription>
					</AlertDialogHeader>

					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => remove.mutate({ id: record.id })}
						>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
