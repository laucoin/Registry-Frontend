import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le dialogue des groupes d'un participant dans les tests.
 * Périmètre: Lit l'ouverture, le titre et les groupes listés, et ferme le dialogue.
 * Limites: Aucune.
 */
export class ParticipantGroupsDialogHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-participant-groups-dialog';

	private readonly dialog = this.locatorFor(byTestId('participant-groups-dialog-dialog'));
	private readonly items = this.locatorForAll(byTestId('participant-groups-dialog-group-item'));

	public async open(): Promise<boolean> {
		return (await this.dialog()).getProperty<boolean>('open');
	}

	public async title(): Promise<string> {
		return (await (await this.dialog()).getProperty<string>('title')) ?? '';
	}

	public async groups(): Promise<string[]> {
		return Promise.all((await this.items()).map(async (item) => (await item.text()).trim()));
	}

	public async hide(): Promise<void> {
		return (await this.dialog()).dispatchEvent('sgdf-hide');
	}
}
