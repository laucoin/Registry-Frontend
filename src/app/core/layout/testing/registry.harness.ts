import { ComponentHarness } from '@angular/cdk/testing';

import { ConfirmationDialogHarness } from '@core/layout/confirmation-dialog/testing/confirmation-dialog.harness';
import { GlobalErrorHarness } from '@core/layout/global-error/testing/global-error.harness';

/**
 * Objectif: Pilote le composant racine dans les tests.
 * Périmètre: Indique si les pages routées ou l'erreur globale sont affichées et donne accès au dialogue de confirmation.
 * Limites: Ne lit pas les toasts : ils sont créés par l'API du web component `sgdf-toast`, que le test observe directement.
 */
export class RegistryHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-root';

	private readonly routedPages = this.locatorForOptional('router-outlet');
	public readonly globalError = this.locatorForOptional(GlobalErrorHarness);
	public readonly confirmationDialog = this.locatorFor(ConfirmationDialogHarness);

	public async showsRoutedPages(): Promise<boolean> {
		return (await this.routedPages()) !== null;
	}
}
