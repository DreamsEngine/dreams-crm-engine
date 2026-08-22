"use client";

import { Button } from "@crm/ui/components/button";
import { cn } from "@crm/ui/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { useWorkspaceUrl } from "@/lib/use-workspace-url";

type SettingsNavKey =
	| "general"
	| "tracking"
	| "connections"
	| "currencies"
	| "members"
	| "sso";

type SettingsNavItem = {
	key: SettingsNavKey;
	href: string;
};

const ROOT = "/settings";

const ITEMS: SettingsNavItem[] = [
	{ key: "general", href: ROOT },
	{ key: "tracking", href: `${ROOT}/tracking` },
	{ key: "connections", href: `${ROOT}/connections` },
	{ key: "currencies", href: `${ROOT}/currencies` },
	{ key: "members", href: `${ROOT}/members` },
	{ key: "sso", href: `${ROOT}/sso` },
];

function isActive(href: string, root: string, pathname: string): boolean {
	return href === root ? pathname === href : pathname.startsWith(href);
}

function NavLink({
	item,
	label,
	active,
	className,
}: {
	item: SettingsNavItem;
	label: string;
	active: boolean;
	className: string;
}) {
	return (
		<Button
			asChild
			variant="ghost"
			className={cn(
				"justify-start font-normal text-muted-foreground",
				active &&
					"bg-muted text-foreground hover:bg-muted hover:text-foreground",
				className,
			)}
		>
			<Link
				href={item.href}
				prefetch
				aria-current={active ? "page" : undefined}
				transitionTypes={["nav-lateral"]}
			>
				{label}
			</Link>
		</Button>
	);
}

export function SettingsSidebarFallback() {
	const t = useTranslations("settings");
	const labels = navLabels(t);

	return (
		<>
			<aside className="hidden w-56 shrink-0 border-r md:block [view-transition-name:settings-sidebar]">
				<nav
					aria-label={t("nav.ariaLabel")}
					aria-busy="true"
					className="flex flex-col gap-0.5 p-3"
				>
					{ITEMS.map((item) => (
						<Button
							key={item.href}
							variant="ghost"
							disabled
							className="w-full justify-start px-3 font-normal text-muted-foreground"
						>
							{labels[item.key]}
						</Button>
					))}
				</nav>
			</aside>

			<nav
				aria-label={t("nav.ariaLabel")}
				aria-busy="true"
				className="flex gap-1 overflow-x-auto border-b p-2 md:hidden [view-transition-name:settings-sidebar]"
			>
				{ITEMS.map((item) => (
					<Button
						key={item.href}
						variant="ghost"
						disabled
						className="shrink-0 justify-start px-3 font-normal text-muted-foreground"
					>
						{labels[item.key]}
					</Button>
				))}
			</nav>
		</>
	);
}

function navLabels(
	t: ReturnType<typeof useTranslations<"settings">>,
): Record<SettingsNavKey, string> {
	return {
		general: t("nav.general"),
		tracking: t("nav.tracking"),
		connections: t("nav.connections"),
		currencies: t("nav.currencies"),
		members: t("nav.members"),
		sso: t("nav.sso"),
	};
}

export function SettingsSidebar() {
	const t = useTranslations("settings");
	const labels = navLabels(t);
	const pathname = usePathname();
	const workspaceUrl = useWorkspaceUrl();

	const root = workspaceUrl(ROOT);
	const items = useMemo(
		() => ITEMS.map((item) => ({ ...item, href: workspaceUrl(item.href) })),
		[workspaceUrl],
	);

	return (
		<>
			<aside className="hidden w-56 shrink-0 border-r md:block [view-transition-name:settings-sidebar]">
				<nav
					aria-label={t("nav.ariaLabel")}
					className="flex flex-col gap-0.5 p-3"
				>
					{items.map((item) => (
						<NavLink
							key={item.href}
							item={item}
							label={labels[item.key]}
							active={isActive(item.href, root, pathname)}
							className="w-full px-3"
						/>
					))}
				</nav>
			</aside>

			<nav
				aria-label={t("nav.ariaLabel")}
				className="flex gap-1 overflow-x-auto border-b p-2 md:hidden [view-transition-name:settings-sidebar]"
			>
				{items.map((item) => (
					<NavLink
						key={item.href}
						item={item}
						label={labels[item.key]}
						active={isActive(item.href, root, pathname)}
						className="shrink-0 px-3"
					/>
				))}
			</nav>
		</>
	);
}
