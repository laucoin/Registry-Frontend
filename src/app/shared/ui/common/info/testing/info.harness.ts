import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le texte d'accueil dans les tests.
 * Périmètre: Lit les paragraphes affichés, dans l'ordre.
 * Limites: Ne lit que le texte ; le composant n'a aucune interaction.
 */
export class InfoHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-info';

	private readonly paragraphs = this.locatorForAll(byTestId('info-paragraph'));

	public async texts(): Promise<string[]> {
		return Promise.all((await this.paragraphs()).map((paragraph) => paragraph.text()));
	}
}
