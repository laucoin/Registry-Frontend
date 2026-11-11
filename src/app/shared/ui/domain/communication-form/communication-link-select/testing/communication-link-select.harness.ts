import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le champ de liaison d'une communication dans les tests.
 * Périmètre: Lit les choix, la valeur et l'erreur, recherche, choisit, quitte et retire le champ.
 * Limites: Ne lit pas le libellé, masqué aux technologies d'assistance au profit de celui du sélecteur.
 */
export class CommunicationLinkSelectHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-communication-link-select';

	private readonly select = this.locatorFor(byTestId('communication-link-select-select'));
	private readonly options = this.locatorForAll(`${byTestId('communication-link-select-select')} sgdf-option`);
	private readonly removeButton = this.locatorFor(byTestId('communication-link-select-remove-button'));

	public async choices(): Promise<string[]> {
		return Promise.all((await this.options()).map((option) => option.getProperty<string>('value')));
	}

	public async value(): Promise<string> {
		return (await (await this.select()).getProperty<string | null>('value')) ?? '';
	}

	public async error(): Promise<string | null> {
		return (await this.select()).getAttribute('error');
	}

	public async search(query: string): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-search', { detail: { query } });
	}

	public async choose(key: string): Promise<void> {
		const select = await this.select();
		await select.setInputValue(key);
		await select.dispatchEvent('change');
	}

	public async leave(): Promise<void> {
		return (await this.select()).dispatchEvent('focusout');
	}

	public async remove(): Promise<void> {
		return (await this.removeButton()).click();
	}
}
