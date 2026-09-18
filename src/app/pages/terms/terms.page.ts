import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigFacade } from '@features/config/config.facade';
import { RuntimeConfigModel } from '@features/config/runtime-config.model';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

@Component({
	selector: 'app-terms-page',
	standalone: true,
	imports: [TranslocoPipe, RouterLink],
	providers: [provideTranslocoScope('terms')],
	templateUrl: './terms.page.html',
	styleUrl: './terms.page.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsPage {
	private readonly configFacade: ConfigFacade = inject(ConfigFacade);

	protected readonly hosting: Signal<RuntimeConfigModel['hosting'] | undefined> =
		this.configFacade.hosting;

	protected readonly orgParams: Signal<{
		organizationName: string;
		creatorName: string;
		creatorEmail: string;
	}> = computed(() => ({
		organizationName: this.configFacade.organization()?.name ?? '',
		creatorName: this.configFacade.creator()?.name ?? '',
		creatorEmail: this.configFacade.creator()?.email ?? '',
	}));
}
