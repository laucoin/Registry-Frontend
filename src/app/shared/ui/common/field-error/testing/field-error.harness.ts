import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le message d'erreur d'un champ dans les tests.
 * Périmètre: Lit le texte affiché sous le champ.
 * Limites: Ne lit pas l'état du champ, porté par le formulaire.
 */
export class FieldErrorHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-field-error';

	private readonly message = this.locatorFor(byTestId('field-error-message'));

	public async text(): Promise<string> {
		return (await this.message()).text();
	}
}
