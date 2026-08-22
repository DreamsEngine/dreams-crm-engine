import type { MailboxProviderId } from "@crm/auth/scopes";
import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthHeading, AuthShell } from "@/components/auth-shell";
import { isDemoOpenSignIn } from "@/lib/env";
import { getSession } from "@/lib/session";
import { getServerQueryClient, getServerTrpc } from "@/lib/trpc/server";
import { DemoCredentialsSignIn } from "./demo-credentials-sign-in";
import { SocialSignIn } from "./social-sign-in";
import { type SsoProvider, SsoSignIn } from "./sso-sign-in";

export const metadata: Metadata = {
	title: "Sign in",
};

type SignInOptions = {
	google: boolean;
	microsoft: boolean;
	providers: SsoProvider[];
};

async function signInOptions(): Promise<SignInOptions | null> {
	try {
		return await getServerQueryClient().fetchQuery(
			getServerTrpc().sso.signInOptions.queryOptions(),
		);
	} catch (error) {
		unstable_rethrow(error);
		console.error("Sign-in: could not read the sign-in options.", error);
		return null;
	}
}

async function currentSession() {
	try {
		return await getSession();
	} catch (error) {
		unstable_rethrow(error);
		console.error("Sign-in: could not read the session.", error);
		return null;
	}
}

export default async function SignInPage({
	searchParams,
}: PageProps<"/sign-in">) {
	const t = await getTranslations("common");

	return (
		<AuthShell>
			<Suspense
				fallback={
					<AuthHeading
						title={t("signIn.title")}
						description={t("signIn.description")}
					/>
				}
			>
				<SignIn searchParams={searchParams} />
			</Suspense>
		</AuthShell>
	);
}

async function SignIn({
	searchParams,
}: Pick<PageProps<"/sign-in">, "searchParams">) {
	const [session, options, { method }, t, tAuth] = await Promise.all([
		currentSession(),
		signInOptions(),
		searchParams,
		getTranslations("common"),
		getTranslations("auth"),
	]);

	if (session) {
		redirect("/");
	}

	const configured: MailboxProviderId[] = [];
	if (options?.google ?? true) configured.push("google");
	if (options?.microsoft ?? false) configured.push("microsoft");

	const providers = options?.providers ?? [];

	const insisted = configured.find((provider) => provider === method);
	const showSso = providers.length > 0 && insisted === undefined;
	const social =
		insisted !== undefined
			? [insisted]
			: providers.length === 0
				? configured
				: [];

	if (!showSso && social.length === 0) {
		return (
			<>
				<AuthHeading
					title={tAuth("noSignInMethod.title")}
					description={tAuth("noSignInMethod.description")}
				/>

				<p className="text-center text-muted-foreground text-sm/5">
					{tAuth("noSignInMethod.instructions")}
				</p>
			</>
		);
	}

	return (
		<>
			<AuthHeading
				title={t("signIn.title")}
				description={t("signIn.description")}
			/>

			{showSso ? <SsoSignIn providers={providers} /> : null}
			{social.map((provider) => (
				<SocialSignIn key={provider} provider={provider} />
			))}
			{isDemoOpenSignIn() ? <DemoCredentialsSignIn /> : null}
		</>
	);
}
