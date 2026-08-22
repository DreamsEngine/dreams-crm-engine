import {
	type EveToolFields,
	type EveToolInput,
	eveToolText,
} from "@crm/validation/eve-tool";
import type { useTranslations } from "next-intl";

type Translator = ReturnType<typeof useTranslations>;

type ArtifactNames = Record<string, string>;

const ARTIFACT_NAMES: ArtifactNames = {
	"agent/instructions.md": "instructions",
	"agent/manifest.json": "the manifest",
	"agent/README.md": "the readme",
};

type ArtifactNameKey = "instructions" | "manifest" | "readme";

const ARTIFACT_NAME_KEYS: Record<string, ArtifactNameKey> = {
	"agent/instructions.md": "instructions",
	"agent/manifest.json": "manifest",
	"agent/README.md": "readme",
};

type LabelInput = {
	tool: string;
	input: EveToolInput;
	label: string;
	pending: boolean;
};

type ToolInputLabel = (
	input: EveToolFields,
	pending: boolean,
	t: Translator | undefined,
) => string | null;

type ToolInputLabels = Record<string, ToolInputLabel>;

const INPUT_LABELS: ToolInputLabels = {
	write_agent_file: (input, pending, t) => {
		const path = eveToolText.parse(input.path);
		if (!path) return null;
		if (t) {
			const artifact = ARTIFACT_NAME_KEYS[path];
			const name = artifact ? t(`toolLabel.artifactNames.${artifact}`) : path;
			return t(pending ? "toolLabel.writingFile" : "toolLabel.wroteFile", {
				name,
			});
		}
		const name = ARTIFACT_NAMES[path] ?? path;
		return pending ? `Writing ${name}` : `Wrote ${name}`;
	},
	save_agent_draft: (input, pending, t) => {
		const name = eveToolText.parse(input.name).trim();
		if (t) {
			return name
				? t(
						pending
							? "toolLabel.savingDraftNamed"
							: "toolLabel.savedDraftNamed",
						{ name },
					)
				: t(pending ? "toolLabel.savingDraft" : "toolLabel.savedDraft");
		}
		const verb = pending ? "Saving draft" : "Saved draft";
		return name ? `${verb} · ${name}` : verb;
	},
	set_chat_title: (input, pending, t) => {
		const title = eveToolText.parse(input.title).trim();
		if (t) {
			return title
				? t(
						pending ? "toolLabel.namingChatNamed" : "toolLabel.namedChatNamed",
						{ name: title },
					)
				: t(pending ? "toolLabel.namingChat" : "toolLabel.namedChat");
		}
		const verb = pending ? "Naming this chat" : "Named this chat";
		return title ? `${verb} · ${title}` : verb;
	},
};

export function toolLabel(item: LabelInput, t?: Translator): string {
	const fromInput = item.input
		? INPUT_LABELS[item.tool]?.(item.input, item.pending, t)
		: null;
	return fromInput ?? item.label;
}
