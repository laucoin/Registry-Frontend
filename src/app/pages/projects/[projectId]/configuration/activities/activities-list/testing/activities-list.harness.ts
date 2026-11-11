import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { ActivitiesSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/activities/activities-search-fields/testing/activities-search-fields.harness';
import { ActivityRowHarness } from '@pages/projects/[projectId]/configuration/activities/activity-row/testing/activity-row.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote la page de la liste des activités dans les tests.
 * Périmètre: Donne la liste, les champs de recherche et les lignes ; lit le titre et les lignes affichées, et suit le
 * bouton de création.
 * Limites: Le harness d'une ligne pilote son contenu.
 */
export class ActivitiesListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-activities-list';

	private readonly heading = this.locatorFor(byTestId('activities-list-title'));
	private readonly createButton = this.locatorForOptional(byTestId('activities-list-create-button'));
	private readonly rowElements = this.locatorForAll(byTestId('activity-row'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(ActivitiesSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async canCreate(): Promise<boolean> {
		return (await this.createButton()) !== null;
	}

	public async create(): Promise<void> {
		return (await this.locatorFor(byTestId('activities-list-create-button'))()).click();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}

	public async row(id: string): Promise<ActivityRowHarness> {
		return this.locatorFor(new HarnessPredicate(ActivityRowHarness, { selector: `[data-id="${id}"]` }))();
	}
}
