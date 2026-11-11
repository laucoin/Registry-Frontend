import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface SelectedElementView {
	value: string | null;
	label: string;
	warning: string | undefined;
	highlighted: boolean;
}

/**
 * Objectif: Pilote le champ de sélection multiple dans les tests.
 * Périmètre: Choisit une suggestion, ouvre la recherche, recherche, lit les suggestions, le message sans résultat, la sélection (lignes, groupes, avertissements, mise en
 * évidence), l'annonce, le message vide et l'erreur, retire un élément ou un groupe et indique si la recherche a le focus.
 * Limites: Ne tape pas dans la recherche ; la page pilote les suggestions.
 */
export class SelectElementsFieldHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-select-elements-field';

	private readonly select = this.locatorFor(byTestId('select-elements-field-select'));
	private readonly options = this.locatorForAll(`${byTestId('select-elements-field-select')} sgdf-option`);
	private readonly rows = this.locatorForAll(byTestId('select-elements-field-row'));
	private readonly groupLabels = this.locatorForAll(byTestId('select-elements-field-group-label'));
	private readonly ungroupedLabel = this.locatorForOptional(byTestId('select-elements-field-ungrouped-label'));
	private readonly empty = this.locatorForOptional(byTestId('select-elements-field-empty'));
	private readonly status = this.locatorFor(byTestId('select-elements-field-announcement'));
	private readonly groupRemovers = this.locatorForAll(byTestId('select-elements-field-group-removing-button'));

	public async choose(value: string): Promise<void> {
		const select = await this.select();
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}

	public async search(query: string): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-search', { detail: { query } });
	}

	public async suggestions(): Promise<string[]> {
		return Promise.all((await this.options()).map(async (option) => (await option.text()).trim()));
	}

	public async open(): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-show');
	}

	public async selectValue(): Promise<string> {
		return (await (await this.select()).getProperty<string | null>('value')) ?? '';
	}

	public async error(): Promise<string | null> {
		return (await this.select()).getAttribute('error');
	}

	public async required(): Promise<boolean> {
		return (await this.select()).getProperty<boolean>('required');
	}

	public async searchFocused(): Promise<boolean> {
		return (await this.select()).isFocused();
	}

	public async selection(): Promise<SelectedElementView[]> {
		return Promise.all((await this.rows()).map((row) => this.viewOf(row)));
	}

	public async groups(): Promise<string[]> {
		return Promise.all((await this.groupLabels()).map((label) => label.text()));
	}

	public async ungroupedTitle(): Promise<string | undefined> {
		return (await this.ungroupedLabel())?.text();
	}

	public async noResultsLabel(): Promise<string | null> {
		return (await this.select()).getAttribute('no-results-label');
	}

	public async emptyMessage(): Promise<string | undefined> {
		return (await this.empty())?.text();
	}

	public async announcement(): Promise<string> {
		return (await this.status()).text();
	}

	public async remove(value: string): Promise<void> {
		const row = `${byTestId('select-elements-field-row')}[data-value="${value}"]`;
		return (await this.locatorFor(`${row} ${byTestId('select-elements-field-element-removing-button')}`)()).click();
	}

	public async removeGroup(index: number): Promise<void> {
		return (await this.groupRemovers())[index].click();
	}

	private async viewOf(row: TestElement): Promise<SelectedElementView> {
		const value = await row.getAttribute('data-value');
		const scope = `${byTestId('select-elements-field-row')}[data-value="${value}"]`;
		const warning = await this.locatorForOptional(`${scope} ${byTestId('select-elements-field-row-warning')}`)();
		return {
			value,
			label: await (await this.locatorFor(`${scope} ${byTestId('select-elements-field-row-label')}`)()).text(),
			warning: await warning?.text(),
			highlighted: await row.hasClass('highlight'),
		};
	}
}
