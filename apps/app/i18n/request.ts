import { getRequestConfig } from "next-intl/server";
import enCommon from "../messages/en/common.json";
import esMxCommon from "../messages/es-MX/common.json";
import enOverview from "../messages/en/overview.json";
import enCompanies from "../messages/en/companies.json";
import enContacts from "../messages/en/contacts.json";
import enDeals from "../messages/en/deals.json";
import enSettings from "../messages/en/settings.json";
import enAuth from "../messages/en/auth.json";
import enOnboarding from "../messages/en/onboarding.json";
import enRecord from "../messages/en/record.json";
import enAgent from "../messages/en/agent.json";
import enShared from "../messages/en/shared.json";
import esMxOverview from "../messages/es-MX/overview.json";
import esMxCompanies from "../messages/es-MX/companies.json";
import esMxContacts from "../messages/es-MX/contacts.json";
import esMxDeals from "../messages/es-MX/deals.json";
import esMxSettings from "../messages/es-MX/settings.json";
import esMxAuth from "../messages/es-MX/auth.json";
import esMxOnboarding from "../messages/es-MX/onboarding.json";
import esMxRecord from "../messages/es-MX/record.json";
import esMxAgent from "../messages/es-MX/agent.json";
import esMxShared from "../messages/es-MX/shared.json";

const catalogues = {
	en: {
		common: enCommon,
		overview: enOverview,
		companies: enCompanies,
		contacts: enContacts,
		deals: enDeals,
		settings: enSettings,
		auth: enAuth,
		onboarding: enOnboarding,
		record: enRecord,
		agent: enAgent,
		shared: enShared,
	},
	"es-MX": {
		common: esMxCommon,
		overview: esMxOverview,
		companies: esMxCompanies,
		contacts: esMxContacts,
		deals: esMxDeals,
		settings: esMxSettings,
		auth: esMxAuth,
		onboarding: esMxOnboarding,
		record: esMxRecord,
		agent: esMxAgent,
		shared: esMxShared,
	},
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
