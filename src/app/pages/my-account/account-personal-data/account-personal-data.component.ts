import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { SessionFacade } from '@core/registry/state/session.facade';
import { RegistryRouteEnum } from '@core/routing/registry-route.enum';
import { AccountDeletionDialogComponent } from '@pages/my-account/account-personal-data/account-deletion-dialog/account-deletion-dialog.component';
import { RouteHelper } from '@shared/helpers/route.helper';
import { AccountActionEnum } from '@shared/models/enumeration/account-action.enum';

import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/icon';
import '@sgdf/ui/table';
import '@sgdf/ui/table-cell';
import '@sgdf/ui/table-row';

/**
 * Objectif: Présente les droits RGPD de l'utilisateur connecté : l'extraction des données et la suppression du compte.
 * Périmètre: Affiche les deux actions avec leur explication et un lien vers la page de confidentialité ; désactive les
 * deux actions et montre celle en cours pendant son exécution.
 * Limites: L'extraction télécharge l'export JSON immédiatement ; la suppression du compte passe par le dialogue de confirmation.
 */
@Component({
	imports: [TranslocoPipe, RouterLink, AccountDeletionDialogComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('my-account')],
	selector: 'app-account-personal-data',
	templateUrl: './account-personal-data.component.html',
})
export class AccountPersonalDataComponent {
	private readonly sessionFacade = inject(SessionFacade);

	protected readonly privacyRoute = RouteHelper.absolute(RegistryRouteEnum.PRIVACY);

	protected readonly AccountActionEnum = AccountActionEnum;
	protected readonly pendingAction = this.sessionFacade.pendingAccountAction;
	protected readonly deletionConfirmationOpen = signal(false);

	protected exportData(): void {
		this.sessionFacade.exportAccount();
	}

	protected deleteAccount(): void {
		this.sessionFacade.deleteAccount();
	}
}
