import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MicrosoftConnection } from "../microsoft-connection";
import {
	type ConnectionQuery,
	OAuthConnectionPage,
} from "../oauth-connection-page";

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations("settings");
	return { title: t("connections.microsoft.metaTitle") };
}

export default function MicrosoftConnectionPage(props: {
	params: Promise<{ slug: string }>;
	searchParams: Promise<ConnectionQuery>;
}) {
	return (
		<OAuthConnectionPage
			{...props}
			connection={MicrosoftConnection}
			provider="microsoft"
		/>
	);
}
