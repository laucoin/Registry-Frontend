import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le choix du motif d'un mouvement dans les tests.
 * Périmètre: Lit les options, la valeur choisie et l'erreur ; ouvre la liste, cherche et choisit un motif.
 * Limites: Aucune.
 */
export class MovementReasonSelectHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movement-reason-select';

	private readonly select = this.locatorFor(byTestId('movement-reason-select-reason-select'));
	private readonly optionElements = this.locatorForAll(
		`${byTestId('movement-reason-select-reason-select')} sgdf-option`,
	);

	public async options(): Promise<string[]> {
		return Promise.all((await this.optionElements()).map(async (option) => (await option.text()).trim()));
	}

	public async value(): Promise<string> {
		return (await (await this.select()).getProperty<string | null>('value')) ?? '';
	}

	public async error(): Promise<string | null> {
		return (await this.select()).getAttribute('error');
	}

	public async open(): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-show');
	}

	public async search(query: string): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-search', { detail: { query } });
	}

	public async choose(key: string): Promise<void> {
		const select = await this.select();
		await select.setInputValue(key);
		await select.dispatchEvent('change');
	}
}
