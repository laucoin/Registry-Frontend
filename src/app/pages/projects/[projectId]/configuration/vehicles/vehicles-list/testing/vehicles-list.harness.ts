import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { VehicleRowHarness } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/testing/vehicle-row.harness';
import { VehiclesSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-search-fields/testing/vehicles-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote la page de la liste des véhicules dans les tests.
 * Périmètre: Donne la liste, les champs de recherche et les lignes ; lit le titre et les lignes affichées, et suit le
 * bouton de création.
 * Limites: Le harness d'une ligne pilote son contenu.
 */
export class VehiclesListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-vehicles-list';

	private readonly heading = this.locatorFor(byTestId('vehicles-list-title'));
	private readonly createButton = this.locatorForOptional(byTestId('vehicles-list-create-button'));
	private readonly rowElements = this.locatorForAll(byTestId('vehicle-row'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(VehiclesSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async canCreate(): Promise<boolean> {
		return (await this.createButton()) !== null;
	}

	public async create(): Promise<void> {
		return (await this.locatorFor(byTestId('vehicles-list-create-button'))()).click();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}

	public async row(id: string): Promise<VehicleRowHarness> {
		return this.locatorFor(new HarnessPredicate(VehicleRowHarness, { selector: `[data-id="${id}"]` }))();
	}
}
