import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { ParticipantGroupsDialogHarness } from '@pages/projects/[projectId]/configuration/participants/participant-groups-dialog/testing/participant-groups-dialog.harness';
import { ParticipantRowHarness } from '@pages/projects/[projectId]/configuration/participants/participant-row/testing/participant-row.harness';
import { ParticipantsSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/participants/participants-search-fields/testing/participants-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote la page de la liste des participants dans les tests.
 * Périmètre: Donne la liste, les champs de recherche et les lignes ; lit le titre et les lignes affichées, et suit le
 * bouton de création.
 * Limites: Le harness d'une ligne pilote son contenu.
 */
export class ParticipantsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-participants-list';

	private readonly heading = this.locatorFor(byTestId('participants-list-title'));
	private readonly createButton = this.locatorForOptional(byTestId('participants-list-create-button'));
	private readonly rowElements = this.locatorForAll(byTestId('participant-row'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(ParticipantsSearchFieldsHarness);
	public readonly groupsDialog = this.locatorFor(ParticipantGroupsDialogHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async canCreate(): Promise<boolean> {
		return (await this.createButton()) !== null;
	}

	public async create(): Promise<void> {
		return (await this.locatorFor(byTestId('participants-list-create-button'))()).click();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}

	public async row(id: string): Promise<ParticipantRowHarness> {
		return this.locatorFor(new HarnessPredicate(ParticipantRowHarness, { selector: `[data-id="${id}"]` }))();
	}
}
