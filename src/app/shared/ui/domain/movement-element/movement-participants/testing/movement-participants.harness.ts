import { ComponentHarness } from '@angular/cdk/testing';

import { MovementPeopleHarness } from '@shared/ui/domain/movement-element/movement-people/testing/movement-people.harness';

/**
 * Objectif: Pilote les onglets des personnes d'un mouvement dans les tests.
 * Périmètre: Lit les libellés des onglets et donne la liste des personnes de chaque panneau, dans l'ordre.
 * Limites: Ne change pas d'onglet ; tous les panneaux sont présents dans le DOM.
 */
export class MovementParticipantsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movement-participants';

	private readonly tabs = this.locatorForAll('sgdf-tab');

	public readonly panels = this.locatorForAll(MovementPeopleHarness);

	public async tabTexts(): Promise<string[]> {
		return Promise.all((await this.tabs()).map(async (tab) => (await tab.text()).trim()));
	}

	public async tabIds(): Promise<(string | null)[]> {
		return Promise.all((await this.tabs()).map((tab) => tab.getAttribute('data-test-id')));
	}
}
