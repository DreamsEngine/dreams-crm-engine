import SlackLogo from "@crm/ui/components/brand-logos/slack";
import { Spinner } from "@crm/ui/components/spinner";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireSession } from "@/lib/session";
import { getServerQueryClient, getServerTrpc } from "@/lib/trpc/server";
import { ConnectionPage } from "../../connection-page";
import { SlackPeopleMatches } from "./slack-people-matches";

type SlackPeoplePageProps = {
	params: Promise<{ slug: string }>;
};

export default function SlackPeoplePage(props: SlackPeoplePageProps) {
	return (
		<Suspense
			fallback={
				<ConnectionPage centered>
					<Spinner size="lg" />
				</ConnectionPage>
			}
		>
			<SlackPeoplePageContent {...props} />
		</Suspense>
	);
}

async function SlackPeoplePageContent({ params }: SlackPeoplePageProps) {
	await requireSession();
	const [{ slug }, t] = await Promise.all([
		params,
		getTranslations("settings"),
	]);
	const queryClient = getServerQueryClient();
	const trpc = getServerTrpc();
	const status = await queryClient.fetchQuery(trpc.slack.status.queryOptions());
	if (!status.connected) redirect(`/${slug}/settings/connections/slack`);
	const matches = await queryClient.fetchQuery(
		trpc.slack.matches.queryOptions(),
	);

	return (
		<ConnectionPage centered>
			<header className="flex flex-col gap-3 px-(--spacing-block-inline) text-center">
				<SlackLogo className="mx-auto size-7" />
				<h1 className="font-medium text-2xl tracking-tight">
					{t("connections.slack.people.connectedTitle")}
				</h1>
				<p className="text-muted-foreground text-sm">
					{t("connections.slack.people.description")}
				</p>
			</header>
			<SlackPeopleMatches slug={slug} initialMatches={matches} />
		</ConnectionPage>
	);
}
