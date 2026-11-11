import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le menu des éléments à ajouter à une communication dans les tests.
 * Périmètre: Lit les entrées (libellé traduit, clé, état) et lance une entrée par sa clé.
 * Limites: N'ouvre pas le menu ; les entrées sont présentes dans le DOM menu fermé.
 */
export class CommunicationFieldMenuHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-communication-field-menu';

	private readonly items = this.locatorForAll(byTestId('communication-field-menu-item'));

	public async entries(): Promise<{ key: string | null; disabled: boolean }[]> {
		return Promise.all(
			(await this.items()).map(async (item) => ({
				key: await item.getAttribute('data-id'),
				disabled: await item.getProperty<boolean>('disabled'),
			})),
		);
	}

	public async run(key: string): Promise<void> {
		return (await this.locatorFor(`${byTestId('communication-field-menu-item')}[data-id="${key}"]`)()).click();
	}
}
