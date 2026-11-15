import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la liste des véhicules d'un mouvement dans les tests.
 * Périmètre: Lit chaque véhicule (identifiant, libellé, conducteur).
 * Limites: Ne lit pas l'icône de la ligne.
 */
export class MovementVehiclesHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movement-vehicles';

	private readonly rows = this.locatorForAll(byTestId('vehicle-row'));

	public async vehicles(): Promise<{ id: string | null; label: string; driver: string }[]> {
		return Promise.all(
			(await this.rows()).map(async (row) => {
				const id = await row.getAttribute('data-id');
				const scope = `${byTestId('vehicle-row')}[data-id="${id}"]`;
				return {
					id,
					label: await (await this.locatorFor(`${scope} ${byTestId('movement-vehicles-label')}`)()).text(),
					driver: await (await this.locatorFor(`${scope} ${byTestId('movement-vehicles-driver')}`)()).text(),
				};
			}),
		);
	}
}
