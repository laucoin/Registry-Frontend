import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, Signal } from '@angular/core';
import { SessionFacade } from "@core/registry/state/session.facade";
import { provideTranslocoScope, TranslocoPipe } from "@jsverse/transloco";
import { ThemeEnum } from "@shared/models/enumeration/theme.enum";
import { ThemeChoiceModel } from "@shared/models/model/theme-choice.model";

/**
 * Purpose: Lets the signed-in user pick the light, dark or system theme of the application.
 * Scope: Shows the choices of the session facade as buttons, marks the active one and forwards the selection.
 * Limits: Does not decide which choices exist nor skip a redundant selection, set the theme on the document or persist it; the session facade does.
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
	private readonly sessionFacade: SessionFacade = inject(SessionFacade)

	protected readonly choices: readonly ThemeChoiceModel[] = this.sessionFacade.themeChoices
	protected readonly currentTheme: Signal<ThemeEnum> = this.sessionFacade.currentUserTheme

	protected select(theme: ThemeEnum): void {
		this.sessionFacade.updateCurrentUserTheme(theme)
	}
}
