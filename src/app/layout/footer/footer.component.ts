import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { APP_VERSION } from '@features/app-version';
import { ConfigFacade } from '@features/config/config.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

@Component({
	selector: 'app-footer',
	standalone: true,
	imports: [TranslocoPipe, RouterLink],
	providers: [provideTranslocoScope('footer')],
	templateUrl: './footer.component.html',
	styleUrl: './footer.component.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
	private readonly configFacade: ConfigFacade = inject(ConfigFacade);
	protected readonly creationYear: number = 2021;
	protected readonly currentYear: number = new Date().getFullYear();
	protected readonly appVersion: string = APP_VERSION;

	protected readonly organizationName: Signal<string | undefined> = computed(
		() => this.configFacade.organization()?.name,
	);
	protected readonly creatorName: Signal<string | undefined> = computed(
		() => this.configFacade.creator()?.name,
	);
	protected readonly creatorWebsite: Signal<string | null | undefined> = computed(
		() => this.configFacade.creator()?.website,
	);
	protected readonly supportIssuesUrl: Signal<string | null | undefined> = computed(
		() => this.configFacade.support()?.issuesUrl,
	);
}
