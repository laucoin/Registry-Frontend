import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface MovementPersonView {
	name: string;
	vehicle: string | undefined;
	reversible: boolean;
}

/**
 * Objectif: Pilote la liste des personnes d'un mouvement dans les tests.
 * Périmètre: Lit chaque personne (nom, véhicule, inversion possible) et demande l'inversion d'une personne.
 * Limites: Ne lit pas l'icône de la ligne.
 */
export class MovementPeopleHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movement-people';

	private readonly rows = this.locatorForAll(byTestId('movement-people-row'));

	public async people(): Promise<MovementPersonView[]> {
		const rows = await this.rows();
		return Promise.all(rows.map(async (row) => this.viewOf(await row.getAttribute('data-id'))));
	}

	public async reverse(participantId: string): Promise<void> {
		return (
			await this.locatorFor(`${this.row(participantId)} ${byTestId('movement-people-reverse-button')}`)()
		).click();
	}

	private row(participantId: string | null): string {
		return `${byTestId('movement-people-row')}[data-id="${participantId}"]`;
	}

	private async viewOf(participantId: string | null): Promise<MovementPersonView> {
		const scope = this.row(participantId);
		const vehicle = await this.locatorForOptional(`${scope} ${byTestId('movement-people-vehicle')}`)();
		const reverse = await this.locatorForOptional(`${scope} ${byTestId('movement-people-reverse-button')}`)();
		return {
			name: await (await this.locatorFor(`${scope} ${byTestId('movement-people-name')}`)()).text(),
			vehicle: await vehicle?.text(),
			reversible: reverse !== null,
		};
	}
}
