import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AccountPreferenceComponent } from '@pages/my-account/account-preference/account-preference.component';
import { EventHelper } from '@shared/helpers/event.helper';
import { REFRESH_CHOICES } from '@shared/helpers/refresh/refresh-choices.const';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { RefreshChoiceModel } from '@shared/models/model/refresh-choice.model';

import '@sgdf/ui/radio';
import '@sgdf/ui/radio-group';

/**
 * Objectif: Permet à l'utilisateur connecté de choisir la fréquence de rafraîchissement en arrière-plan des données à l'écran.
 * Périmètre: Affiche les modes de rafraîchissement sous forme de boutons, marque le mode actif et relaie la sélection à la facade de session.
 * Limites: N'exécute pas le rafraîchissement et ne persiste pas le choix ; le service de rafraîchissement et la facade de session le font.
 */
@Component({
	imports: [TranslocoPipe, AccountPreferenceComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-refresh',
	templateUrl: './account-refresh.component.html',
})
export class AccountRefreshComponent {
	private readonly sessionFacade = inject(SessionFacade);
	protected readonly uiFacade = inject(UiFacade);

	protected readonly choices: readonly RefreshChoiceModel[] = REFRESH_CHOICES;
	protected readonly currentMode = this.sessionFacade.currentUserRefreshMode;

	protected select(event: Event): void {
		this.sessionFacade.updateCurrentUserRefreshMode(EventHelper.valueOf(event) as RefreshModeEnum);
	}
}
