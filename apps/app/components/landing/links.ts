export const REPO_URL = "https://github.com/trycompai/crm";
export const REPO_STARS = "4.4k";

export const REPO_LINKS = [
	{ id: "github", href: REPO_URL },
	{ id: "issues", href: `${REPO_URL}/issues` },
	{ id: "pullRequests", href: `${REPO_URL}/pulls` },
	{ id: "contributing", href: `${REPO_URL}/blob/main/CONTRIBUTING.md` },
	{ id: "license", href: `${REPO_URL}/blob/main/LICENSE` },
] as const;
