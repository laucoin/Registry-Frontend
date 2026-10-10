import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { RegistryFacade } from "@core/registry/state/registry.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { ThemeEnum } from "@shared/models/enumeration/theme.enum";

interface ThemeChoice {
	theme: ThemeEnum
	labelKey: string
	icon: string
}

/**
 * Purpose: Lets the signed-in user pick the light, dark or system theme of the application.
 * Scope: Shows the three choices as buttons, marks the active one and applies the choice to the preferences.
 * Limits: Does not set the theme on the document or persist it itself; the registry facade does.
 */
@Component({
	imports: [
		TranslocoPipe,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-theme',
	styleUrl: './account-theme.component.css',
	templateUrl: './account-theme.component.html',
})
export class AccountThemeComponent {
	private readonly registryFacade: RegistryFacade = inject(RegistryFacade)

	protected readonly choices: ThemeChoice[] = [
		{ theme: ThemeEnum.LIGHT, labelKey: 'myAccount.theme.light', icon: 'sun' },
		{ theme: ThemeEnum.DARK, labelKey: 'myAccount.theme.dark', icon: 'moon' },
		{ theme: ThemeEnum.SYSTEM, labelKey: 'myAccount.theme.system', icon: 'desktop' },
	]
	protected readonly currentTheme: Signal<ThemeEnum | undefined> = this.registryFacade.currentUserTheme

	protected select(theme: ThemeEnum): void {
		if (theme !== this.currentTheme()) {
			this.registryFacade.updateCurrentUserTheme(theme)
		}
	}
}
