import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { ProjectProfileRowHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profile-row/testing/project-profile-row.harness';
import { ProjectProfilesSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-search-fields/testing/project-profiles-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote la page de la liste des profils d'un projet dans les tests.
 * Périmètre: Donne la liste, les champs de recherche et les lignes ; lit le titre et les lignes affichées, et suit le
 * bouton d'invitation.
 * Limites: Le harness d'une ligne pilote son contenu.
 */
export class ProjectProfilesListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-profiles-list';

	private readonly heading = this.locatorFor(byTestId('project-profiles-list-title'));
	private readonly createButton = this.locatorForOptional(byTestId('project-profiles-list-few-button'));
	private readonly rowElements = this.locatorForAll(byTestId('profile-row'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(ProjectProfilesSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async canCreate(): Promise<boolean> {
		return (await this.createButton()) !== null;
	}

	public async create(): Promise<void> {
		return (await this.locatorFor(byTestId('project-profiles-list-few-button'))()).click();
	}

	public async rows(): Promise<string[]> {
		return Promise.all((await this.rowElements()).map(async (row) => (await row.getAttribute('data-id')) ?? ''));
	}

	public async row(id: string): Promise<ProjectProfileRowHarness> {
		return this.locatorFor(new HarnessPredicate(ProjectProfileRowHarness, { selector: `[data-id="${id}"]` }))();
	}
}
