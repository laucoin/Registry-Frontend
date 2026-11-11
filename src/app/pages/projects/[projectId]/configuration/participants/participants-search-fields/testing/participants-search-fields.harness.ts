import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote les champs de recherche des participants dans les tests.
 * Périmètre: Lit et saisit le texte recherché, lit et choisit le statut, lit les statuts proposés, indique si le
 * filtre de visibilité est proposé et le choisit.
 * Limites: Ne pilote pas le tri.
 */
export class ParticipantsSearchFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-participants-search-fields';

	private readonly query = this.locatorFor(byTestId('participants-search-fields-q-input'));
	private readonly status = this.locatorFor(byTestId('participants-search-fields-status-select'));
	private readonly options = this.locatorForAll(
		`${byTestId('participants-search-fields-status-select')} sgdf-option`,
	);

	public async searchedText(): Promise<string> {
		return (await this.query()).getProperty<string>('value');
	}

	public async search(text: string): Promise<void> {
		const input = await this.query();
		await typeInto(input, text);
		await input.dispatchEvent('focusout');
	}

	public async statuses(): Promise<string[]> {
		return Promise.all((await this.options()).map(async (option) => (await option.text()).trim()));
	}

	public async chosenStatus(): Promise<string> {
		return (await this.status()).getProperty<string>('value');
	}

	public async chooseStatus(value: string): Promise<void> {
		const select = await this.status();
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}

	public async visibilityShown(): Promise<boolean> {
		return (await this.locatorForOptional(byTestId('participants-search-fields-is-visible-select'))()) !== null;
	}

	public async chooseVisibility(value: string): Promise<void> {
		const select = await this.locatorFor(byTestId('participants-search-fields-is-visible-select'))();
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}
}
