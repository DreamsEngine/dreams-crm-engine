"use client";

import Renew from "@carbon/icons-react/es/Renew";
import TrashCan from "@carbon/icons-react/es/TrashCan";
import {
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from "@crm/ui/components/dropdown-menu";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	BulkActionsMenu,
	BulkDeleteDialog,
	BulkOwnerMenu,
	reportBulk,
} from "@/components/crm/bulk-actions";
import { CompanyMenuSearch } from "@/components/crm/company-picker";
import { useCrmCache } from "@/lib/trpc/cache";
import { useTRPC } from "@/lib/trpc/client";

export function ContactsBulkActions({
	ids,
	onDone,
}: {
	ids: string[];
	onDone: () => void;
}) {
	const t = useTranslations("contacts");
	const trpc = useTRPC();
	const cache = useCrmCache();
	const users = useQuery(trpc.users.list.queryOptions());
	const [confirming, setConfirming] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const companySearch = useRef<HTMLInputElement>(null);

	const onError = (error: { message: string }) => toast.error(error.message);

	const assignOwner = useMutation(
		trpc.contacts.bulkAssignOwner.mutationOptions({
			onSuccess: async (result) => {
				await cache.contact();
				reportBulk(result, (count) => t("bulkActions.reassigned", { count }));
				onDone();
			},
			onError,
		}),
	);

	const setCompany = useMutation(
		trpc.contacts.bulkSetCompany.mutationOptions({
			onSuccess: async (result) => {
				await cache.contact();
				reportBulk(result, (count) => t("bulkActions.moved", { count }));
				onDone();
			},
			onError,
		}),
	);

	const enrich = useMutation(
		trpc.contacts.bulkEnrich.mutationOptions({
			onSuccess: async (result) => {
				await cache.contact();
				reportBulk(result, (count) => t("bulkActions.enriching", { count }));
				onDone();
			},
			onError,
		}),
	);

	const remove = useMutation(
		trpc.contacts.bulkDelete.mutationOptions({
			onSuccess: async (result, variables) => {
				await cache.removedMany({ kind: "contact", ids: variables.ids });
				reportBulk(result, (count) => t("bulkActions.deleted", { count }));
				setConfirming(false);
				onDone();
			},
			onError,
		}),
	);

	const pending =
		assignOwner.isPending ||
		setCompany.isPending ||
		enrich.isPending ||
		remove.isPending;

	return (
		<>
			<BulkActionsMenu
				pending={pending}
				open={menuOpen}
				onOpenChange={setMenuOpen}
			>
				<BulkOwnerMenu
					users={users.data ?? []}
					unassignedLabel={t("bulkActions.unassignedLabel")}
					onSelect={(ownerId) => assignOwner.mutate({ ids, ownerId })}
				/>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						{t("bulkActions.moveToCompany")}
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent
						className="w-64 p-0"
						onFocus={(event) => {
							if (event.target === event.currentTarget) {
								companySearch.current?.focus();
							}
						}}
					>
						<CompanyMenuSearch
							none={t("bulkActions.noCompany")}
							inputRef={companySearch}
							onSelect={(companyId) => {
								setMenuOpen(false);
								setCompany.mutate({ ids, companyId });
							}}
						/>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuGroup>
					<DropdownMenuItem onSelect={() => enrich.mutate({ ids })}>
						<Renew />
						{t("bulkActions.reEnrich")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						variant="destructive"
						onSelect={() => setConfirming(true)}
					>
						<TrashCan />
						{t("bulkActions.delete")}
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</BulkActionsMenu>

			<BulkDeleteDialog
				open={confirming}
				onOpenChange={setConfirming}
				title={t("bulkActions.deleteTitle", { count: ids.length })}
				description={t("bulkActions.deleteDescription")}
				onConfirm={() => remove.mutate({ ids })}
			/>
		</>
	);
}
