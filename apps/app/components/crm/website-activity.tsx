"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
	DetailSheetProperties,
	DetailSheetProperty,
	DetailSheetSection,
} from "@/components/detail-sheet";
import { LocalRelativeTime } from "@/components/local-date-time";
import { useTRPC } from "@/lib/trpc/client";

type Translate = (
	key: string,
	values?: Record<string, string | number>,
) => string;

type Touch = {
	source: string;
	medium: string | null;
	campaign: string | null;
	at: string | null;
};

export function WebsiteActivity({
	companyId,
	contactId,
}: {
	companyId?: string;
	contactId?: string;
}) {
	const t = useTranslations("record");
	const trpc = useTRPC();

	const company = useQuery({
		...trpc.tracking.companyActivity.queryOptions({
			companyId: companyId ?? "",
		}),
		enabled: Boolean(companyId),
	});

	const contact = useQuery({
		...trpc.tracking.contactActivity.queryOptions({
			contactId: contactId ?? "",
		}),
		enabled: Boolean(contactId) && !companyId,
	});

	const activity = companyId ? company.data : contact.data;

	if (!activity?.identified) return null;
	if (activity.pages.length === 0 && !activity.firstTouch) return null;

	const topPage = activity.pages[0];
	const first = activity.firstTouch;
	const last = activity.lastTouch;
	const channelChanged =
		first != null && last != null && channel(last, t) !== channel(first, t);
	const campaign = last?.campaign ?? first?.campaign ?? null;

	return (
		<DetailSheetSection title={t("websiteActivity.title")}>
			<DetailSheetProperties>
				<DetailSheetProperty label={t("websiteActivity.pageViews")}>
					<span className="tabular-nums">
						{activity.views.toLocaleString()}
					</span>
					{activity.lastSeenAt ? (
						<span className="text-muted-foreground">
							{" · "}
							{t("websiteActivity.lastSeen")}{" "}
							<LocalRelativeTime date={activity.lastSeenAt} />
						</span>
					) : null}
				</DetailSheetProperty>

				{first ? (
					<DetailSheetProperty label={t("websiteActivity.originalSource")}>
						{channel(first, t)}
					</DetailSheetProperty>
				) : null}

				{topPage ? (
					<DetailSheetProperty label={t("websiteActivity.topPage")}>
						<span className="flex min-w-0 items-baseline gap-1">
							<span className="truncate font-mono" title={topPage.path}>
								{topPage.path}
							</span>
							<span className="shrink-0 text-muted-foreground">
								{"· "}
								<span className="tabular-nums">{topPage.views}</span>{" "}
								{t("websiteActivity.viewsSuffix", { count: topPage.views })}
							</span>
						</span>
					</DetailSheetProperty>
				) : null}

				{channelChanged ? (
					<DetailSheetProperty label={t("websiteActivity.latestSource")}>
						{channel(last, t)}
					</DetailSheetProperty>
				) : null}

				{first?.at ? (
					<DetailSheetProperty label={t("websiteActivity.firstSeen")}>
						<LocalRelativeTime date={first.at} />
					</DetailSheetProperty>
				) : null}

				{campaign ? (
					<DetailSheetProperty label={t("websiteActivity.campaign")}>
						{campaign}
					</DetailSheetProperty>
				) : null}
			</DetailSheetProperties>
		</DetailSheetSection>
	);
}

function channel(touch: Touch | null, t: Translate): string {
	if (!touch) return t("websiteActivity.unknown");
	if (!touch.medium || touch.medium === "direct") return touch.source;
	return `${touch.source} · ${touch.medium}`;
}
