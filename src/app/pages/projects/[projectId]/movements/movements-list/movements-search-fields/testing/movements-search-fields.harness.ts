import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote les champs de recherche de la liste des mouvements dans les tests.
 * Périmètre: Lit les filtres affichés et leur valeur, et choisit la valeur d'un filtre.
 * Limites: Ne saisit pas la période.
 */
export class MovementsSearchFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movements-search-fields';

	public async filters(): Promise<string[]> {
		const fields = await this.locatorForAll(
			'[data-test-id^="movements-search-fields-"][data-test-id$="-select"]',
		)();
		return Promise.all(fields.map(async (field) => (await field.getAttribute('data-test-id')) ?? ''));
	}

	public async value(filter: string): Promise<string> {
		return (await this.select(filter)).getProperty<string>('value');
	}

	public async choose(filter: string, value: string): Promise<void> {
		const select = await this.select(filter);
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}

	private async select(filter: string): Promise<TestElement> {
		return this.locatorFor(byTestId(`movements-search-fields-${filter}-select`))();
	}
}
