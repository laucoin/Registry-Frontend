import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le choix de l'utilisateur lié à un participant dans les tests.
 * Périmètre: Lit les options, la valeur choisie, le texte d'aide et l'état désactivé ; ouvre la liste, cherche et choisit
 * un utilisateur.
 * Limites: Aucune.
 */
export class ParticipantUserSelectHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-participant-user-select';

	private readonly select = this.locatorFor(byTestId('participant-user-select-user-select'));
	private readonly optionElements = this.locatorForAll(
		`${byTestId('participant-user-select-user-select')} sgdf-option`,
	);

	public async options(): Promise<string[]> {
		return Promise.all((await this.optionElements()).map(async (option) => (await option.text()).trim()));
	}

	public async value(): Promise<string> {
		return (await (await this.select()).getProperty<string | null>('value')) ?? '';
	}

	public async hint(): Promise<string> {
		return (await (await this.select()).getProperty<string | null>('hint')) ?? '';
	}

	public async disabled(): Promise<boolean> {
		return (await (await this.select()).getProperty<boolean | null>('disabled')) ?? false;
	}

	public async open(): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-show');
	}

	public async search(query: string): Promise<void> {
		return (await this.select()).dispatchEvent('sgdf-search', { detail: { query } });
	}

	public async choose(id: string): Promise<void> {
		const select = await this.select();
		await select.setInputValue(id);
		await select.dispatchEvent('change');
	}
}
