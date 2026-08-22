"use client";

import { cn } from "@crm/ui/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BentoCard, CardHeading } from "./bento-card";
import { SendArrow } from "./send-arrow";

const QUESTION_IDS = ["what", "who", "changed"] as const;

type QuestionId = (typeof QUESTION_IDS)[number];

/**
 * The one card a reader can actually drive: picking a question loads it into
 * the composer. It goes no further on purpose — the answer needs a record, and
 * the homepage does not send anybody to a sign-in form to see one.
 */
export function AskCard() {
	const t = useTranslations("shared");
	const [asked, setAsked] = useState<QuestionId | null>(null);

	return (
		<BentoCard className="grow gap-6">
			<CardHeading
				title={t("landing.askCard.title")}
				body={t("landing.askCard.body")}
			/>

			<div className="flex grow flex-col justify-end gap-2.5">
				<p className="select-none font-medium text-[#5A5A5A] text-[11px]/4">
					{t("landing.askCard.suggested")}
				</p>
				{QUESTION_IDS.map((id) => (
					<button
						key={id}
						type="button"
						aria-pressed={asked === id}
						onClick={() => setAsked(id)}
						className={cn(
							"flex h-[38px] shrink-0 cursor-pointer select-none items-center rounded-md px-3 text-left text-[13px]/[18px] transition-colors",
							asked === id
								? "bg-accent text-foreground"
								: "bg-muted hover:bg-accent",
						)}
					>
						{t(`landing.askCard.questions.${id}`)}
					</button>
				))}
			</div>

			<div className="flex h-11 shrink-0 items-center gap-2.5 rounded-md border border-border bg-[#1A1A1A] pr-1.5 pl-3.5 transition-colors focus-within:border-ring">
				<span
					className={cn(
						"min-w-0 grow truncate text-[13px]/[18px]",
						asked ? "text-foreground" : "text-[#6E6E6E]",
					)}
				>
					{asked
						? t(`landing.askCard.questions.${asked}`)
						: t("landing.askCard.placeholder")}
				</span>
				<span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-primary">
					<SendArrow className="size-3.5 text-primary-foreground" />
				</span>
			</div>
		</BentoCard>
	);
}
