import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { ConfigFacade } from '@core/config/config.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { RuntimeConfigModel } from '@shared/models/runtime-config.model';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';

@Component({
	imports: [TranslocoPipe, PageTitleComponent],
	providers: [provideTranslocoScope('privacy')],
	templateUrl: './privacy.page.html',
	styleUrl: './privacy.page.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Static privacy-policy route, personalized with the organization's hosting/creator info.
 * Scope: Reads ConfigFacade only; renders translated legal copy with those values interpolated.
 * Limits: No data fetching or state mutation of its own.
 */
export class PrivacyPage {
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	protected readonly hosting: Signal<RuntimeConfigModel['hosting'] | undefined> =
		this._configFacade.hosting;

	protected readonly orgParams: Signal<{
		organizationName: string;
		creatorName: string;
		creatorEmail: string;
	}> = computed(() => ({
		organizationName: this._configFacade.organization()?.name ?? '',
		creatorName: this._configFacade.creator()?.name ?? '',
		creatorEmail: this._configFacade.creator()?.email ?? '',
	}));
}
