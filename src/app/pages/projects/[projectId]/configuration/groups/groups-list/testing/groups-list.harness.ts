import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { GroupRowHarness } from '@pages/projects/[projectId]/configuration/groups/group-row/testing/group-row.harness';
import { GroupsSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/groups/groups-search-fields/testing/groups-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote la page de la liste des groupes dans les tests.
 * Périmètre: Donne la liste, les champs de recherche et les lignes ; lit le titre et les lignes affichées, et suit le
 * bouton de création.
 * Limites: Le harness d'une ligne pilote son contenu.
 */
export class GroupsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-groups-list';

	private readonly heading = this.locatorFor(byTestId('groups-list-title'));
	private readonly createButton = this.locatorForOptional(byTestId('groups-list-create-button'));
	private readonly rowElements = this.locatorForAll(byTestId('group-row'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(GroupsSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async canCreate(): Promise<boolean> {
		return (await this.createButton()) !== null;
	}

	public async create(): Promise<void> {
		return (await this.locatorFor(byTestId('groups-list-create-button'))()).click();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}

	public async row(id: string): Promise<GroupRowHarness> {
		return this.locatorFor(new HarnessPredicate(GroupRowHarness, { selector: `[data-id="${id}"]` }))();
	}
}
