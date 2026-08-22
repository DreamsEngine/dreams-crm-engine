import ArrowRight from "@carbon/icons-react/es/ArrowRight";
import GitHubLogo from "@crm/ui/components/brand-logos/github";
import StripeLogo from "@crm/ui/components/brand-logos/stripe";
import VercelLogo from "@crm/ui/components/brand-logos/vercel";
import { cn } from "@crm/ui/lib/utils";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { AskCard } from "./ask-card";
import {
	BentoCard,
	CardBody,
	CardHeading,
	CardTitle,
	MonoLabel,
} from "./bento-card";
import { SectionHeading } from "./section-heading";

const ENRICHMENT_ROWS = [
	{
		name: "Stripe",
		domain: "stripe.com",
		logo: <StripeLogo className="size-5 shrink-0" />,
		researching: false,
	},
	{
		name: "Vercel",
		domain: "vercel.com",
		logo: <VercelLogo className="size-5 shrink-0 text-white" />,
		researching: false,
	},
	{
		name: "GitHub",
		domain: "github.com",
		logo: <GitHubLogo className="size-5 shrink-0 text-muted-foreground" />,
		researching: true,
	},
];

const SUGGESTED_AGENT_IDS = [
	"renewalBrief",
	"flagInactive",
	"handOff",
] as const;

const FOLLOW_UPS = [
	{ id: "recheck", due: "14d", next: true },
	{ id: "brief", due: "2d", next: false },
	{ id: "reEnrich", due: "90d", next: false },
] as const;

export function CapabilitiesSection() {
	const t = useTranslations("shared");

	return (
		<section className="relative flex w-full shrink-0 flex-col items-center px-6 pt-20 pb-20 md:pb-30">
			<div className="flex w-full max-w-6xl flex-col gap-12 md:gap-[72px]">
				<SectionHeading title={t("landing.capabilities.title")} />

				<div className="flex flex-col gap-4 lg:flex-row">
					<div className="flex min-w-0 grow flex-col gap-4">
						<EnrichmentCard />
						<div className="flex flex-col gap-4 sm:flex-row">
							<AgentBuilderCard />
							<FollowUpCard />
						</div>
					</div>

					<div className="flex w-full shrink-0 flex-col gap-4 lg:w-[400px]">
						<AskCard />
					</div>
				</div>
			</div>
		</section>
	);
}

function EnrichmentCard() {
	const t = useTranslations("shared");

	return (
		<BentoCard className="gap-6">
			<CardHeading
				title={t("landing.capabilities.enrichment.title")}
				body={t("landing.capabilities.enrichment.body")}
			/>

			<div className="flex select-none flex-col">
				{ENRICHMENT_ROWS.map((row) => (
					<div
						key={row.name}
						className="-mx-2 flex h-11 shrink-0 items-center gap-3 rounded-sm border-border border-t px-2 transition-colors hover:bg-muted/50"
					>
						<span className={cn(row.researching && "animate-pulse")}>
							{row.logo}
						</span>
						<span className="min-w-0 grow font-medium text-[13px]/4">
							{row.name}
						</span>
						<span className="hidden w-[180px] shrink-0 font-mono text-muted-foreground text-xs sm:block">
							{row.domain}
						</span>
						{row.researching ? (
							<StatusBadge className="gap-1 bg-border text-muted-foreground">
								<ResearchingSpinner />
								{t("landing.capabilities.enrichment.researching")}
							</StatusBadge>
						) : (
							<StatusBadge className="bg-primary text-primary-foreground">
								{t("landing.capabilities.enrichment.enriched")}
							</StatusBadge>
						)}
					</div>
				))}
			</div>
		</BentoCard>
	);
}

function AgentBuilderCard() {
	const t = useTranslations("shared");

	return (
		<BentoCard className="min-w-0 grow gap-5">
			<CardTitle>{t("landing.capabilities.agentBuilder.title")}</CardTitle>
			<CardBody>{t("landing.capabilities.agentBuilder.body")}</CardBody>

			<div className="flex select-none flex-col">
				<MonoLabel className="h-[26px] shrink-0">
					{t("landing.capabilities.agentBuilder.suggestedLabel")}
				</MonoLabel>
				{SUGGESTED_AGENT_IDS.map((id) => (
					<div
						key={id}
						className="flex h-11 shrink-0 items-center gap-3 border-border border-t"
					>
						<span className="min-w-0 grow font-medium text-[13px]/[18px]">
							{t(`landing.capabilities.agentBuilder.agents.${id}`)}
						</span>
						<ArrowRight size={14} className="shrink-0 text-muted-foreground" />
					</div>
				))}
			</div>
		</BentoCard>
	);
}

function FollowUpCard() {
	const t = useTranslations("shared");

	return (
		<BentoCard className="min-w-0 grow gap-5">
			<CardTitle>{t("landing.capabilities.followUps.title")}</CardTitle>

			<ul className="flex select-none flex-col gap-[14px]">
				{FOLLOW_UPS.map((item) => (
					<li key={item.id} className="flex items-center gap-2.5">
						<span
							className={cn(
								"size-[7px] shrink-0 rounded-full",
								item.next ? "animate-pulse bg-primary" : "bg-[#3A3A3A]",
							)}
						/>
						<span
							className={cn(
								"min-w-0 grow text-[13px]/[18px]",
								item.next ? "text-foreground" : "text-muted-foreground",
							)}
						>
							{t(`landing.capabilities.followUps.items.${item.id}`)}
						</span>
						<span className="shrink-0 font-mono text-[11px]/[18px] text-[#6E6E6E]">
							{item.due}
						</span>
					</li>
				))}
			</ul>

			<div className="flex flex-col gap-2 pt-1">
				<MonoLabel>{t("landing.capabilities.followUps.whyLabel")}</MonoLabel>
				<p className="text-[13px]/[21px] text-muted-foreground">
					{t("landing.capabilities.followUps.whyBody")}
				</p>
			</div>
		</BentoCard>
	);
}

function StatusBadge({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<span
			className={cn(
				"flex w-[104px] shrink-0 items-center justify-center rounded-sm px-2 py-[3px] text-[11px]/[14px]",
				className,
			)}
		>
			{children}
		</span>
	);
}

function ResearchingSpinner() {
	return (
		<svg
			viewBox="0 0 16 16"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			className="size-[11px] shrink-0 animate-spin"
		>
			<circle
				cx="8"
				cy="8"
				r="6"
				fill="none"
				stroke="#4A4A4A"
				strokeWidth="2"
			/>
			<path
				d="M8 2a6 6 0 0 1 6 6"
				fill="none"
				stroke="var(--ring)"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
