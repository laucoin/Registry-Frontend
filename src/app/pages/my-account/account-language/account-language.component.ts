import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { AccountPreferenceComponent } from '@pages/my-account/account-preference/account-preference.component';
import { EventHelper } from '@shared/helpers/event.helper';

import '@sgdf/ui/option';
import '@sgdf/ui/radio';
import '@sgdf/ui/radio-group';
import '@sgdf/ui/select';

/**
 * Objectif: Permet à l'utilisateur connecté de choisir la langue d'affichage de l'application.
 * Périmètre: Affiche les langues configurées sous forme de boutons, ou de select au-delà de deux, relaie le choix et montre quelle langue est en cours d'enregistrement.
 * Limites: Ne décide pas des langues existantes, ne charge pas les traductions et ne persiste rien lui-même ; la facade de session le fait.
 */
@Component({
	imports: [TranslocoPipe, AccountPreferenceComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-language',
	templateUrl: './account-language.component.html',
})
export class AccountLanguageComponent {
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly availableLanguages: readonly string[] = this.sessionFacade.availableLanguages;
	protected readonly currentLanguage = this.sessionFacade.currentUserLanguage;
	protected readonly pendingLanguage = this.sessionFacade.pendingLanguage;

	protected select(event: Event): void {
		this.sessionFacade.updateCurrentUserLanguage(EventHelper.valueOf(event));
	}
}
