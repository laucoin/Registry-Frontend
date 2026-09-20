import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { APP_VERSION } from '@core/config/app-version';
import { ConfigFacade } from '@core/config/config.facade';
import { GlobalErrorFacade } from '@core/error/global-error.facade';
import { GlobalErrorReason } from '@core/error/global-error.store';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { LucideCircleAlert, LucideRefreshCw } from '@lucide/angular';

const GITHUB_ISSUES_URL_PATTERN: RegExp = /github\.com\/.+\/issues/i;

// Matches the "id" of each field in .github/ISSUE_TEMPLATE/bug_report.yml — GitHub prefills an issue
// form field by matching a query param name against its id.
const BUG_REPORT_TEMPLATE: string = 'bug_report.yml';

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

	protected readonly reason: Signal<GlobalErrorReason | null> = this._globalErrorFacade.reason;

	protected readonly messageKey: Signal<string> = computed(() => {
		switch (this.reason()) {
			case 'CONFIG_LOAD_FAILED':
				return 'globalError.configLoadFailed';
			case 'TOKEN_EXCHANGE_FAILED':
				return 'globalError.tokenExchangeFailed';
			case 'SESSION_CHECK_FAILED':
			default:
				return 'globalError.sessionCheckFailed';
		}
	});

	protected readonly supportUrl: Signal<string | null> = computed(() => {
		const reason: GlobalErrorReason | null = this.reason();
		const issuesUrl: string | null | undefined = this._configFacade.support()?.issuesUrl;
		if (!reason || reason === 'CONFIG_LOAD_FAILED' || !issuesUrl) {
			return null;
		}
		if (!GITHUB_ISSUES_URL_PATTERN.test(issuesUrl)) {
			return issuesUrl;
		}
		const base: string = issuesUrl.endsWith('/') ? issuesUrl.slice(0, -1) : issuesUrl;
		const params: URLSearchParams = new URLSearchParams({
			template: BUG_REPORT_TEMPLATE,
			description: `Startup error: ${reason}`,
			version: APP_VERSION,
		});
		return `${base}/new?${params.toString()}`;
	});

	protected retry(): void {
		this._globalErrorFacade.retry();
	}
}
