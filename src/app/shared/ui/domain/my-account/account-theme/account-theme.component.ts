import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { ThemeChoiceModel } from '@shared/models/model/theme-choice.model';

import '@sgdf/ui/icon';
import '@sgdf/ui/radio';
import '@sgdf/ui/radio-group';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';

/**
 * Purpose: Permet à l'utilisateur connecté de choisir le thème clair, sombre ou système de l'application.
 * Scope: Affiche les choix de la facade de session sous forme de boutons, marque le choix actif et relaie la sélection.
 * Limits: Ne décide pas des choix existants, n'évite pas une sélection redondante, ne pose pas le thème sur le document et ne le persiste pas ; la facade de session le fait.
 */
@Component({
	imports: [TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-theme',
	styleUrl: './account-theme.component.css',
	templateUrl: './account-theme.component.html',
})
export class AccountThemeComponent {
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly choices: readonly ThemeChoiceModel[] = this.sessionFacade.themeChoices;
	protected readonly currentTheme = this.sessionFacade.currentUserTheme;

	protected select(theme: ThemeEnum): void {
		this.sessionFacade.updateCurrentUserTheme(theme);
	}
}
