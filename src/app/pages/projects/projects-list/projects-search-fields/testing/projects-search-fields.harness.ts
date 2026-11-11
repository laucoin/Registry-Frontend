import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote les champs de recherche de la liste des projets dans les tests.
 * Périmètre: Lit les filtres affichés, saisit et valide le texte recherché, et choisit la valeur d'un filtre.
 * Limites: Ne saisit pas la date.
 */
export class ProjectsSearchFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-projects-search-fields';

	private readonly query = this.locatorFor(byTestId('projects-search-fields-q-input'));

	public async filters(): Promise<string[]> {
		const fields = await this.locatorForAll('[data-test-id^="projects-search-fields-"][data-test-id$="-select"]')();
		return Promise.all(fields.map(async (field) => (await field.getAttribute('data-test-id')) ?? ''));
	}

	public async searchedText(): Promise<string> {
		return (await this.query()).getProperty<string>('value');
	}

	public async search(text: string): Promise<void> {
		const input = await this.query();
		await typeInto(input, text);
		await input.dispatchEvent('focusout');
	}

	public async choose(filter: string, value: string): Promise<void> {
		const select = await this.locatorFor(byTestId(`projects-search-fields-${filter}-select`))();
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}
}
