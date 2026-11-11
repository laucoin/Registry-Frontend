import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormErrorHarness } from '@shared/ui/common/form-error/testing/form-error.harness';

/**
 * Objectif: Pilote le cadre d'un formulaire de page dans les tests.
 * Périmètre: Indique si le chargement est affiché, lit le titre de page et donne l'erreur du formulaire.
 * Limites: Ne lit pas le contenu projeté, piloté par le harness de la page.
 */
export class FormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-form';

	private readonly spinner = this.locatorForOptional(byTestId('form-spinner'));
	private readonly heading = this.locatorForOptional(byTestId('form-title'));

	public readonly error = this.locatorForOptional(FormErrorHarness);

	public async loading(): Promise<boolean> {
		return (await this.spinner()) !== null;
	}

	public async title(): Promise<string | undefined> {
		return (await this.heading())?.getProperty<string>('title');
	}
}
