import { ComponentHarness } from '@angular/cdk/testing';

import { MovementsSearchFieldsHarness } from '@pages/projects/[projectId]/movements/movements-list/movements-search-fields/testing/movements-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

export enum MovementCreationEnum {
	REGISTERED = 'registered',
	GUEST = 'guest',
}

/**
 * Objectif: Pilote la page de la liste des mouvements dans les tests.
 * Périmètre: Donne la liste et les champs de recherche, lit le titre et les lignes affichées, et suit les boutons de
 * création.
 * Limites: Ne pilote pas le contenu d'une ligne ; le harness de l'élément de mouvement le fait.
 */
export class MovementsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movements-list';

	private readonly heading = this.locatorFor(byTestId('movements-list-title'));
	private readonly rowElements = this.locatorForAll(byTestId('movement-row'));
	private readonly createButtons = this.locatorForAll(
		`${byTestId('movements-list-registered-button')}, ${byTestId('movements-list-guest-button')}`,
	);

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(MovementsSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async creations(): Promise<string[]> {
		return Promise.all((await this.createButtons()).map(async (button) => (await button.text()).trim()));
	}

	public async create(kind: MovementCreationEnum): Promise<void> {
		return (await this.locatorFor(byTestId(`movements-list-${kind}-button`))()).click();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}
}
