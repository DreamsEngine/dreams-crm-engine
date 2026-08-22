import {
	Controller,
	ForbiddenException,
	Get,
	Headers,
	Logger,
	Post,
	ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import type { EnvironmentVariables } from "../config/env.validation";
import { FollowUpService } from "./follow-up.service";

@Controller("internal/followup")
export class FollowUpController {
	private readonly logger = new Logger(FollowUpController.name);
	private readonly secret: string | undefined;
	private readonly enabled: boolean;

	constructor(
		private readonly followUp: FollowUpService,
		config: ConfigService<EnvironmentVariables, true>,
	) {
		this.secret = config.get("CRON_SECRET", { infer: true });
		this.enabled = config.get("FOLLOWUP", { infer: true }) === "1";
	}

	@Get("sweep")
	@AllowAnonymous()
	async sweepViaGet(@Headers("authorization") authorization?: string) {
		return this.run(authorization);
	}

	@Post("sweep")
	@AllowAnonymous()
	async sweepViaPost(@Headers("authorization") authorization?: string) {
		return this.run(authorization);
	}

	private async run(authorization?: string) {
		if (!this.enabled) {
			throw new ServiceUnavailableException(
				"The follow-up module is off. Set FOLLOWUP=1 to turn it on.",
			);
		}

		if (!this.secret) {
			this.logger.error({
				message:
					"CRON_SECRET is not set — refusing to run the follow-up sweep.",
			});
			throw new ServiceUnavailableException("Follow-up is not configured.");
		}

		if (!timingSafeEquals(authorization ?? "", `Bearer ${this.secret}`)) {
			throw new ForbiddenException();
		}

		return this.followUp.sweep();
	}
}

function timingSafeEquals(a: string, b: string): boolean {
	if (a.length !== b.length) return false;

	let mismatch = 0;
	for (let index = 0; index < a.length; index += 1) {
		mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
	}

	return mismatch === 0;
}
