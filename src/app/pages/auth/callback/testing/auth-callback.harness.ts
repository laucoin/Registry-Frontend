import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la page de retour du fournisseur d'identité dans les tests.
 * Périmètre: Lit le libellé de l'indicateur affiché pendant l'échange du code.
 * Limites: L'erreur est affichée par la coque de l'application, hors de cette page.
 */
export class AuthCallbackHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-auth-callback';

	private readonly spinner = this.locatorForOptional(byTestId('auth-callback-spinner'));

	public async spinnerLabel(): Promise<string | undefined> {
		return (await (await this.spinner())?.getProperty<string>('label')) ?? undefined;
	}
}
