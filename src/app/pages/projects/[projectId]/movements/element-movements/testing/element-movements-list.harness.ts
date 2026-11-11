import { ComponentHarness } from '@angular/cdk/testing';

import { MovementsSearchFieldsHarness } from '@pages/projects/[projectId]/movements/movements-list/movements-search-fields/testing/movements-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote le gabarit des pages listant les mouvements d'un élément dans les tests.
 * Périmètre: Lit le titre ou son squelette et les lignes, et donne la liste et sa recherche.
 * Limites: Le harness de l'élément de mouvement pilote le contenu d'une ligne.
 */
export class ElementMovementsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-element-movements-list';

	private readonly heading = this.locatorFor(byTestId('element-movements-list-title'));
	private readonly skeleton = this.locatorForOptional(byTestId('element-movements-list-title-skeleton'));
	private readonly rowElements = this.locatorForAll(byTestId('movement-row'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(MovementsSearchFieldsHarness);

	public async title(): Promise<string | undefined> {
		if (await this.skeleton()) return undefined;
		return (await (await this.heading()).text()).trim();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}
}
