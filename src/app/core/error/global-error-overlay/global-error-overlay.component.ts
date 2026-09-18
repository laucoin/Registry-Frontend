import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { ConfigFacade } from '@core/config/config.facade';
import { GlobalErrorFacade } from '@core/error/global-error.facade';
import { GlobalErrorReason } from '@core/error/global-error.store';
import { UrlService } from '@core/navigation/url.service';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { LucideCircleAlert, LucideRefreshCw } from '@lucide/angular';

// Record (not a switch) so TypeScript refuses to compile if a GlobalErrorReason is added here without
// also getting an i18n key — a switch with a default silently falls through instead.
const MESSAGE_KEY_BY_REASON: Record<GlobalErrorReason, string> = {
	CONFIG_LOAD_FAILED: 'globalError.configLoadFailed',
	SESSION_CHECK_FAILED: 'globalError.sessionCheckFailed',
	TOKEN_EXCHANGE_FAILED: 'globalError.tokenExchangeFailed',
};

@Component({
	imports: [TranslocoPipe, LucideCircleAlert, LucideRefreshCw],
	providers: [provideTranslocoScope('globalError')],
	selector: 'app-global-error-overlay',
	styleUrl: './global-error-overlay.component.less',
	templateUrl: './global-error-overlay.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Full-screen overlay shown in place of the whole app when a genuinely unrecoverable startup
 * failure occurs — backend unreachable, current-user check failing, or the login exchange failing.
 * Scope: Pure display driven by GlobalErrorFacade.reason; offers a reload button and, when the runtime
 * config is available (it is for every reason except CONFIG_LOAD_FAILED), a support link. When that link
 * is a GitHub issues URL, it is prefilled to open .github/ISSUE_TEMPLATE/bug_report.yml with its
 * "description" and "version" fields already filled in.
 * Limits: Mounted by RegistryComponent in place of the router outlet; has no dismiss action of its own.
 */
export class GlobalErrorOverlayComponent {
	private readonly _globalErrorFacade: GlobalErrorFacade = inject(GlobalErrorFacade);
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);
	private readonly _urlService: UrlService = inject(UrlService);

	protected readonly reason: Signal<GlobalErrorReason | null> = this._globalErrorFacade.reason;

	protected readonly messageKey: Signal<string> = computed(
		() => MESSAGE_KEY_BY_REASON[this.reason() ?? 'SESSION_CHECK_FAILED'],
	);

	protected readonly supportUrl: Signal<string | null> = computed(() => {
		const reason: GlobalErrorReason | null = this.reason();
		const issuesUrl: string | null | undefined = this._configFacade.support()?.issuesUrl;
		if (!reason || reason === 'CONFIG_LOAD_FAILED' || !issuesUrl) {
			return null;
		}
		return this._urlService.buildGithubIssueUrl(issuesUrl, `Startup error: ${reason}`);
	});

	protected retry(): void {
		this._globalErrorFacade.retry();
	}
}
