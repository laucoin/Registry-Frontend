import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { ProjectRowStatusHarness } from '@pages/projects/projects-list/project-row-status/testing/project-row-status.harness';
import { ProjectsSearchFieldsHarness } from '@pages/projects/projects-list/projects-search-fields/testing/projects-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ElementActionsHarness } from '@shared/ui/common/element-actions/testing/element-actions.harness';
import { FavoriteToggleHarness } from '@shared/ui/common/favorite-toggle/testing/favorite-toggle.harness';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

export enum ProjectsListDialogEnum {
	OPTIONS = 'options',
	HIDDEN = 'hidden',
}

export interface ProjectRowView {
	name: string;
	initials: string;
	period: string;
	disabled: boolean;
}

/**
 * Objectif: Pilote la page de la liste des projets dans les tests.
 * Périmètre: Donne la liste, les champs de recherche et, par ligne, la fin de ligne, le favori et les actions ; lit le
 * titre, les lignes, l'accueil de la liste vide et les deux dialogues, et suit les boutons de création.
 * Limites: Ne lit pas la date de dernière actualisation.
 */
export class ProjectsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-projects-list';

	private readonly heading = this.locatorFor(byTestId('projects-list-title'));
	private readonly createButton = this.locatorForOptional(byTestId('projects-list-create-button'));
	private readonly welcome = this.locatorForOptional(byTestId('projects-list-welcome-title'));
	private readonly welcomeCreate = this.locatorForOptional(byTestId('projects-list-create-project-button'));
	private readonly rowElements = this.locatorForAll(byTestId('project-row'));
	private readonly optionItems = this.locatorForAll(byTestId('projects-list-option-item'));
	private readonly optionsDialog = this.locatorFor(byTestId('projects-list-options-dialog'));
	private readonly hiddenDialog = this.locatorFor(byTestId('projects-list-hidden-dialog'));
	private readonly hiddenMessage = this.locatorFor(byTestId('projects-list-hidden-message'));
	private readonly hiddenClose = this.locatorFor(byTestId('projects-list-close-button'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(ProjectsSearchFieldsHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async canCreate(): Promise<[boolean, boolean]> {
		return [(await this.createButton()) !== null, (await this.welcomeCreate()) !== null];
	}

	public async welcomeShown(): Promise<boolean> {
		return (await this.welcome()) !== null;
	}

	public async rows(): Promise<ProjectRowView[]> {
		const rows = await this.rowElements();
		return Promise.all(rows.map(async (row) => this.rowView(await row.getAttribute('data-id'))));
	}

	public async status(id: string): Promise<ProjectRowStatusHarness> {
		return this.locatorFor(new HarnessPredicate(ProjectRowStatusHarness, { ancestor: this.rowScope(id) }))();
	}

	public async favorite(id: string): Promise<FavoriteToggleHarness> {
		return this.locatorFor(new HarnessPredicate(FavoriteToggleHarness, { ancestor: this.rowScope(id) }))();
	}

	public async actions(id: string): Promise<ElementActionsHarness> {
		return this.locatorFor(new HarnessPredicate(ElementActionsHarness, { ancestor: this.rowScope(id) }))();
	}

	public async optionsShown(): Promise<{ open: boolean; options: string[] }> {
		const options = await Promise.all((await this.optionItems()).map(async (item) => (await item.text()).trim()));
		return { open: await (await this.optionsDialog()).getProperty<boolean>('open'), options };
	}

	public async hiddenNotice(): Promise<{ open: boolean; message: string }> {
		return {
			open: await (await this.hiddenDialog()).getProperty<boolean>('open'),
			message: (await (await this.hiddenMessage()).text()).trim(),
		};
	}

	public async closeHiddenNotice(): Promise<void> {
		return (await this.hiddenClose()).click();
	}

	public async hideDialog(name: ProjectsListDialogEnum): Promise<void> {
		return (
			await (name === ProjectsListDialogEnum.OPTIONS ? this.optionsDialog() : this.hiddenDialog())
		).dispatchEvent('sgdf-hide');
	}

	private rowScope(id: string): string {
		return `${byTestId('project-row')}[data-id="${id}"]`;
	}

	private async rowView(id: string | null): Promise<ProjectRowView> {
		const scope = this.rowScope(id ?? '');
		const text = async (testId: string): Promise<string> =>
			(await (await this.locatorFor(`${scope} ${byTestId(testId)}`)()).text()).replace(/\s+/g, ' ').trim();
		return {
			name: await text('project-row-name'),
			initials: (await (await this.locatorFor(`${scope} sgdf-avatar`)()).getProperty<string>('initials')) ?? '',
			period: await text('project-row-period'),
			disabled: await (await this.locatorFor(scope)()).getProperty<boolean>('disabled'),
		};
	}
}
