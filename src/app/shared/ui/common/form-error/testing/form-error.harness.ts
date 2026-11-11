import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote l'erreur de formulaire dans les tests.
 * Périmètre: Indique si l'encadré est affiché et lit son titre et son texte.
 * Limites: Ne lit que l'encadré d'erreur du formulaire.
 */
export class FormErrorHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-form-error';

	private readonly callout = this.locatorForOptional(byTestId('form-error-callout'));

	public async shown(): Promise<boolean> {
		return (await this.callout()) !== null;
	}

	public async title(): Promise<string | undefined> {
		return (await this.callout())?.getProperty<string>('title');
	}

	public async text(): Promise<string | undefined> {
		return (await this.callout())?.text();
	}
}
