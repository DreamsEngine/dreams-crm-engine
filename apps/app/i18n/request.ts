import { getRequestConfig } from "next-intl/server";
import enCommon from "../messages/en/common.json";
import esMxCommon from "../messages/es-MX/common.json";

const catalogues = {
	en: { common: enCommon },
	"es-MX": { common: esMxCommon },
};

type Locale = keyof typeof catalogues;

const DEFAULT_LOCALE: Locale = "en";

function activeLocale(): Locale {
	const locale = process.env.LOCALE;
	return locale !== undefined && locale in catalogues
		? (locale as Locale)
		: DEFAULT_LOCALE;
}

export default getRequestConfig(() => {
	const locale = activeLocale();

	return {
		locale,
		messages: catalogues[locale],
	};
});
