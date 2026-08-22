"use client";

import CheckmarkFilled from "@carbon/icons-react/es/CheckmarkFilled";
import Warning from "@carbon/icons-react/es/Warning";
import { Alert, AlertDescription, AlertTitle } from "@crm/ui/components/alert";
import { Button } from "@crm/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@crm/ui/components/card";
import { Field, FieldDescription, FieldLabel } from "@crm/ui/components/field";
import { Icon } from "@crm/ui/components/icon";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@crm/ui/components/input-group";
import { Spinner } from "@crm/ui/components/spinner";
import { StatusIndicator } from "@crm/ui/components/status-indicator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";

type Result = RouterOutputs["tracking"]["verify"];
type SettingsTranslator = ReturnType<typeof useTranslations<"settings">>;

export function VerifyInstallation() {
	const t = useTranslations("settings");
	const trpc = useTRPC();
	const urlId = useId();

	const [url, setUrl] = useState("");
	const [result, setResult] = useState<Result | null>(null);

	const tracking = useQuery(trpc.tracking.settings.queryOptions());

	const verify = useMutation(
		trpc.tracking.verify.mutationOptions({
			onSuccess: (outcome) => setResult(outcome),
			onError: (error) => toast.error(error.message),
		}),
	);

	if (!tracking.data) return null;

	const { canManage, siteId } = tracking.data;

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<div className="flex items-center gap-2">
						{t("tracking.verify.title")}
						{result ? <Indicator result={result} t={t} /> : null}
					</div>
				</CardTitle>
				<CardDescription>{t("tracking.verify.description")}</CardDescription>

				<CardAction>
					<Button
						size="sm"
						type="submit"
						form="verify-tracking"
						disabled={!canManage || verify.isPending || url.trim() === ""}
					>
						{verify.isPending ? <Spinner data-icon="inline-start" /> : null}
						{t("tracking.verify.checkNow")}
					</Button>
				</CardAction>
			</CardHeader>

			<CardContent>
				<form
					id="verify-tracking"
					onSubmit={(event) => {
						event.preventDefault();
						setResult(null);
						verify.mutate({ url: url.trim() });
					}}
				>
					<Field>
						<FieldLabel htmlFor={urlId}>
							{t("tracking.verify.pageLabel")}
						</FieldLabel>
						<InputGroup>
							<InputGroupAddon>
								<InputGroupText>https://</InputGroupText>
							</InputGroupAddon>
							<InputGroupInput
								id={urlId}
								value={url}
								onChange={(event) => {
									setUrl(event.target.value);
									setResult(null);
								}}
								placeholder={t("tracking.verify.pagePlaceholder")}
								autoComplete="off"
								autoCapitalize="off"
								autoCorrect="off"
								spellCheck={false}
								inputMode="url"
								disabled={!canManage || verify.isPending}
							/>
						</InputGroup>
						<FieldDescription>{t("tracking.verify.pageHint")}</FieldDescription>
					</Field>
				</form>

				{result && siteId ? (
					<Outcome result={result} siteId={siteId} t={t} />
				) : null}
			</CardContent>
		</Card>
	);
}

function Indicator({ result, t }: { result: Result; t: SettingsTranslator }) {
	if (result.status === "found" && result.pageView) {
		return (
			<StatusIndicator
				size="sm"
				tone="success"
				label={t("tracking.verify.verifiedJustNow")}
			/>
		);
	}

	if (result.status === "found" && result.container?.carriesSiteId === false) {
		return (
			<StatusIndicator
				size="sm"
				tone="warning"
				label={t("tracking.verify.tagManagerNeedsFix")}
			/>
		);
	}

	return (
		<StatusIndicator
			size="sm"
			tone="warning"
			label={
				result.status === "found"
					? t("tracking.verify.noPageViewYet")
					: t("tracking.verify.notDetected")
			}
		/>
	);
}

function Outcome({
	result,
	siteId,
	t,
}: {
	result: Result;
	siteId: string;
	t: SettingsTranslator;
}) {
	if (result.status === "unreachable") {
		return (
			<Alert variant="destructive">
				<Icon icon={Warning} />
				<AlertTitle>
					{t("tracking.verify.unreachableTitle", { host: result.host })}
				</AlertTitle>
				<AlertDescription>
					{t("tracking.verify.unreachableDescription", {
						detail: result.detail,
					})}
				</AlertDescription>
			</Alert>
		);
	}

	if (result.status === "missing") {
		return (
			<Alert variant="destructive">
				<Icon icon={Warning} />
				<AlertTitle>
					{t("tracking.verify.missingTitle", { host: result.host })}
				</AlertTitle>
				<AlertDescription>
					{t("tracking.verify.missingDescription", {
						ms: result.responseMs,
					})}
					{result.containers.length > 0
						? t("tracking.verify.missingContainersNote", {
								containers: result.containers.join(" and "),
							})
						: ""}
				</AlertDescription>
			</Alert>
		);
	}

	if (result.container && !result.container.carriesSiteId) {
		return (
			<Alert variant="destructive">
				<Icon icon={Warning} />
				<AlertTitle>{t("tracking.verify.dropTitle")}</AlertTitle>
				<AlertDescription>
					{t("tracking.verify.dropDescription", {
						containerId: result.container.id,
					})}
					{result.pageView ? t("tracking.verify.dropPageViewNote") : ""}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert>
			<Icon icon={CheckmarkFilled} className="text-success" />
			<AlertTitle>
				{result.container
					? t("tracking.verify.foundInContainer", {
							containerId: result.container.id,
						})
					: t("tracking.verify.foundOnHost", { host: result.host })}
			</AlertTitle>
			<AlertDescription>
				{t("tracking.verify.answeredIn", {
					ms: result.responseMs,
					siteId,
					allowedClause: result.allowed
						? t("tracking.verify.allowedYes")
						: t("tracking.verify.allowedNo"),
				})}
				{result.container ? t("tracking.verify.tagNotInHtmlNote") : ""}
				{result.pageView
					? t("tracking.verify.pageViewArrivedNote")
					: t("tracking.verify.noPageViewYetNote")}
			</AlertDescription>
		</Alert>
	);
}
