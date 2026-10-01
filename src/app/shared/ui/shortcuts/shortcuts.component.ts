import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfigFacade } from '@core/config/config.facade';
import { TranslocoPipe } from '@jsverse/transloco';
import {
	LucideCircleHelp,
	LucideGauge,
	LucideSettings,
	LucideShieldCheck,
	LucideUsers,
} from '@lucide/angular';
import { NzCardComponent } from 'ng-zorro-antd/card';

@Component({
	imports: [
		TranslocoPipe,
		RouterLink,
		NzCardComponent,
		LucideGauge,
		LucideUsers,
		LucideSettings,
		LucideShieldCheck,
		LucideCircleHelp,
	],
	selector: 'app-shortcuts',
	styleUrl: './shortcuts.component.less',
	templateUrl: './shortcuts.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home-page widget with quick navigation links to the app's main sections.
 * Scope: Pure display; the help-center link reads its URL from ConfigFacade.
 * Limits: No data fetching or state of its own beyond that.
 */
export class ShortcutsComponent {
	private readonly _configFacade: ConfigFacade = inject(ConfigFacade);

	protected readonly helpCenterUrl: Signal<string | null | undefined> = computed(
		() => this._configFacade.support()?.helpCenterUrl,
	);
}
