"use client";

import { authClient } from "@crm/auth/client";
import { Button } from "@crm/ui/components/button";
import { Input } from "@crm/ui/components/input";
import { Label } from "@crm/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

export function DemoCredentialsSignIn() {
	const [pending, setPending] = useState(false);

	async function submit(formData: FormData) {
		const email = String(formData.get("email") ?? "").trim();
		const password = String(formData.get("password") ?? "");
		if (!email || password.length < 8) {
			toast.error("Enter an email and a password of at least 8 characters.");
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
		toast.error(signedUp.error.message ?? "Could not sign in.");
	}

	return (
		<form
			className="flex flex-col gap-4"
			onSubmit={(event) => {
				event.preventDefault();
				submit(new FormData(event.currentTarget)).catch(() => {
					setPending(false);
					toast.error("Could not reach the sign-in service.");
				});
			}}
		>
			<div className="flex items-center gap-3">
				<div className="h-px flex-1 bg-border" />
				<span className="font-mono text-muted-foreground text-xs/4 uppercase">
					or with email
				</span>
				<div className="h-px flex-1 bg-border" />
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="demo-email">Email</Label>
				<Input
					id="demo-email"
					name="email"
					type="email"
					autoComplete="email"
					placeholder="you@company.com"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="demo-password">Password</Label>
				<Input
					id="demo-password"
					name="password"
					type="password"
					autoComplete="current-password"
					minLength={8}
					placeholder="At least 8 characters"
					required
				/>
			</div>

			<Button type="submit" disabled={pending}>
				Continue
			</Button>

			<p className="text-center text-muted-foreground text-xs/4">
				First visit creates your demo account with that email and password.
			</p>
		</form>
	);
}
