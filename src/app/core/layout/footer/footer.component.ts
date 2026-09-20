import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_VERSION } from '@core/config/app-version';
import { ConfigFacade } from '@core/config/config.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { RuntimeConfigModel } from '@shared/models/runtime-config.model';

@Component({
	selector: 'app-footer',
	imports: [TranslocoPipe, RouterLink],
	providers: [provideTranslocoScope('footer')],
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: App-wide footer — organization/creator/support info, app version, copyright years.
 * Scope: Pure display; reads its data from ConfigFacade only.
 * Limits: No side effects or navigation logic beyond the rendered links.
 */
export class FooterComponent {
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);
	protected readonly creationYear: number = 2021;
	protected readonly currentYear: number = new Date().getFullYear();
	protected readonly appVersion: string = APP_VERSION;

	protected readonly organizationName: Signal<string | undefined> = computed(() => this._configFacade.organization()?.name);
	protected readonly creator: Signal<RuntimeConfigModel['creator'] | undefined> = this._configFacade.creator;
	protected readonly supportIssuesUrl: Signal<string | null | undefined> = computed(() => this._configFacade.support()?.issuesUrl);
}
