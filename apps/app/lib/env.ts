export const API_URL =
	process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function isMarketing(): boolean {
	return process.env.IS_MARKETING === "true";
}

export function isDemoOpenSignIn(): boolean {
	return process.env.DEMO_OPEN_SIGN_IN === "1";
}
