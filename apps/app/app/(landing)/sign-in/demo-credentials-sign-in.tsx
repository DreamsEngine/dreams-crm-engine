"use client";

import { authClient } from "@crm/auth/client";
import { Button } from "@crm/ui/components/button";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function DemoCredentialsSignIn() {
	const t = useTranslations("auth");
	const [pending, setPending] = useState(false);

	async function submit(formData: FormData) {
		const email = String(formData.get("email") ?? "").trim();
		const password = String(formData.get("password") ?? "");
		if (!email || password.length < 8) {
			toast.error(t("demoCredentialsSignIn.validationError"));
			return;
		}

		setPending(true);

		const signedIn = await authClient.signIn.email({ email, password });
		if (!signedIn.error) {
			window.location.href = "/";
			return;
		}

		const name = email.split("@")[0] ?? email;
		const signedUp = await authClient.signUp.email({ email, password, name });
		if (!signedUp.error) {
			window.location.href = "/";
			return;
		}

		setPending(false);
		toast.error(
			signedUp.error.message ?? t("demoCredentialsSignIn.signInFailed"),
		);
	}

	return (
		<form
			className="flex flex-col gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				submit(new FormData(event.currentTarget)).catch(() => {
					setPending(false);
					toast.error(t("demoCredentialsSignIn.genericError"));
				});
			}}
		>
			<div className="flex items-center gap-3">
				<div className="h-px flex-1 bg-border" />
				<span className="font-mono text-muted-foreground text-xs/4 uppercase">
					{t("demoCredentialsSignIn.orWithEmail")}
				</span>
				<div className="h-px flex-1 bg-border" />
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="demo-email">
					{t("demoCredentialsSignIn.emailLabel")}
				</Label>
				<Input
					id="demo-email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder={t("demoCredentialsSignIn.emailPlaceholder")}
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="demo-password">
					{t("demoCredentialsSignIn.passwordLabel")}
				</Label>
				<Input
					id="demo-password"
					name="password"
					type="password"
					autoComplete="current-password"
					minLength={8}
					placeholder={t("demoCredentialsSignIn.passwordPlaceholder")}
					required
				/>
			</div>

			<Button type="submit" disabled={pending}>
				{t("demoCredentialsSignIn.continue")}
			</Button>

			<p className="text-center text-muted-foreground text-xs/4">
				{t("demoCredentialsSignIn.hint")}
			</p>
		</form>
	);
}
