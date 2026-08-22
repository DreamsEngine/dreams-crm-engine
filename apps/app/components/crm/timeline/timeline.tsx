"use client";

import Chat from "@carbon/icons-react/es/Chat";
import Checkmark from "@carbon/icons-react/es/Checkmark";
import Email from "@carbon/icons-react/es/Email";
import Events from "@carbon/icons-react/es/Events";
import Task from "@carbon/icons-react/es/Task";
import Time from "@carbon/icons-react/es/Time";
import { Button } from "@crm/ui/components/button";
import type { CarbonIcon } from "@crm/ui/components/icon";
import { Spinner } from "@crm/ui/components/spinner";
import { ToggleGroup, ToggleGroupItem } from "@crm/ui/components/toggle-group";
import { cn } from "@crm/ui/lib/utils";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useQueryState } from "nuqs";
import { useMemo } from "react";
import { DetailSheetEmpty, SECTION_TITLE } from "@/components/detail-sheet";
import { useTRPC } from "@/lib/trpc/client";
import { useHydrated } from "@/lib/use-hydrated";
import { ActivityComposer } from "./activity-composer";
import { TimelineEntry, type TimelineEntryData } from "./timeline-entry";
import {
	historyFilter,
	TIMELINE_PARAM,
	TIMELINE_TABS,
	type TimelineTab,
	timelineTabParser,
} from "./timeline-search-params";

export type TimelineAnchor =
	| { companyId: string }
	| { contactId: string }
	| { dealId: string };

type Translate = (
	key: string,
	values?: Record<string, string | number>,
) => string;

function tabLabels(t: Translate): Record<TimelineTab, string> {
	return {
		all: t("timeline.tabAll"),
		notes: t("timeline.tabNotes"),
		email: t("timeline.tabEmail"),
		meetings: t("timeline.tabMeetings"),
		upcoming: t("timeline.tabUpcoming"),
		done: t("timeline.tabDone"),
	};
}

function emptyStates(
	t: Translate,
): Record<TimelineTab, { title: string; description: string }> {
	return {
		all: {
			title: t("timeline.emptyAllTitle"),
			description: t("timeline.emptyAllDescription"),
		},
		notes: {
			title: t("timeline.emptyNotesTitle"),
			description: t("timeline.emptyNotesDescription"),
		},
		email: {
			title: t("timeline.emptyEmailTitle"),
			description: t("timeline.emptyEmailDescription"),
		},
		meetings: {
			title: t("timeline.emptyMeetingsTitle"),
			description: t("timeline.emptyMeetingsDescription"),
		},
		upcoming: {
			title: t("timeline.emptyUpcomingTitle"),
			description: t("timeline.emptyUpcomingDescription"),
		},
		done: {
			title: t("timeline.emptyDoneTitle"),
			description: t("timeline.emptyDoneDescription"),
		},
	};
}

const EMPTY_ICONS = {
	all: Time,
	notes: Chat,
	email: Email,
	meetings: Events,
	upcoming: Task,
	done: Checkmark,
} satisfies Record<TimelineTab, CarbonIcon>;

function dayLabel(
	day: string,
	local: boolean,
	t: Translate,
	dayFormat: Intl.DateTimeFormat,
): string {
	const now = new Date();
	const today = dayKey(now.toISOString(), local);
	const yesterdayDate = local
		? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
		: new Date(Date.now() - 86_400_000);
	const yesterday = dayKey(yesterdayDate.toISOString(), local);

	if (day === today) return t("timeline.today");
	if (day === yesterday) return t("timeline.yesterday");
	return dayFormat.format(new Date(`${day}T00:00:00`));
}

function byDay(
	entries: TimelineEntryData[],
	local: boolean,
	t: Translate,
	dayFormat: Intl.DateTimeFormat,
) {
	const groups = new Map<
		string,
		{ day: string; label: string; entries: TimelineEntryData[] }
	>();

	for (const entry of entries) {
		const day = dayKey(entry.occurredAt ?? entry.createdAt, local);

		const group = groups.get(day);
		if (group) {
			group.entries.push(entry);
		} else {
			groups.set(day, {
				day,
				label: dayLabel(day, local, t, dayFormat),
				entries: [entry],
			});
		}
	}

	return [...groups.values()];
}

function dayKey(value: string, local: boolean): string {
	if (!local) return value.slice(0, 10);
	const date = new Date(value);
	return [
		date.getFullYear(),
		String(date.getMonth() + 1).padStart(2, "0"),
		String(date.getDate()).padStart(2, "0"),
	].join("-");
}

function TimelineDay({
	label,
	entries,
	anchor,
}: {
	label: string;
	entries: TimelineEntryData[];
	anchor: TimelineAnchor;
}) {
	return (
		<section>
			<h3 className={cn("sticky top-0 z-10 bg-popover py-2", SECTION_TITLE)}>
				{label}
			</h3>
			<ul className="divide-y">
				{entries.map((entry) => (
					<TimelineEntry key={entry.id} entry={entry} anchor={anchor} />
				))}
			</ul>
		</section>
	);
}

export function Timeline({ anchor }: { anchor: TimelineAnchor }) {
	const t = useTranslations("record");
	const locale = useLocale();
	const dayFormat = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				weekday: "short",
				month: "short",
				day: "numeric",
				year: "numeric",
			}),
		[locale],
	);
	const trpc = useTRPC();
	const hydrated = useHydrated();
	const labels = tabLabels(t);
	const states = emptyStates(t);

	const [tab, setTab] = useQueryState(TIMELINE_PARAM, timelineTabParser);

	const counts = useQuery(trpc.activities.timelineCounts.queryOptions(anchor));

	const pinned = useQuery({
		...trpc.activities.timeline.queryOptions({
			...anchor,
			filter: "upcoming",
			limit: 10,
		}),
		enabled: tab === "all",
	});

	const history = useInfiniteQuery({
		...trpc.activities.timeline.infiniteQueryOptions(
			{ ...anchor, filter: historyFilter(tab) },
			{ getNextPageParam: (page) => page.nextCursor ?? undefined },
		),
	});

	const entries = history.data?.pages.flatMap((page) => page.entries) ?? [];
	const pinnedEntries = tab === "all" ? (pinned.data?.entries ?? []) : [];

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex shrink-0 flex-col gap-2 border-b px-5 py-3">
				<ActivityComposer anchor={anchor} />

				<ToggleGroup
					type="single"
					value={tab}
					onValueChange={(next) => {
						if (next) void setTab(next as TimelineTab);
					}}
					size="sm"
					spacing={0}
				>
					{TIMELINE_TABS.map((option) => (
						<ToggleGroupItem key={option} value={option}>
							{labels[option]}
							{counts.data?.[option] ? (
								<span className="tabular-nums opacity-60">
									{counts.data[option]}
								</span>
							) : null}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			</div>

			{history.isPending ? (
				<div className="flex min-h-0 flex-1 items-center justify-center">
					<Spinner />
				</div>
			) : entries.length === 0 && pinnedEntries.length === 0 ? (
				<DetailSheetEmpty
					icon={EMPTY_ICONS[tab]}
					title={states[tab].title}
					description={states[tab].description}
				/>
			) : (
				<div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4">
					{pinnedEntries.length > 0 ? (
						<TimelineDay
							label={t("timeline.outstanding")}
							entries={pinnedEntries}
							anchor={anchor}
						/>
					) : null}

					{byDay(entries, hydrated, t, dayFormat).map((group) => (
						<TimelineDay
							key={group.day}
							label={group.label}
							entries={group.entries}
							anchor={anchor}
						/>
					))}

					{history.hasNextPage ? (
						<Button
							variant="outline"
							size="sm"
							className="mt-4 self-start"
							disabled={history.isFetchingNextPage}
							onClick={() => history.fetchNextPage()}
						>
							{history.isFetchingNextPage ? <Spinner /> : null}
							{t("timeline.showOlder")}
						</Button>
					) : null}
				</div>
			)}
		</div>
	);
}
