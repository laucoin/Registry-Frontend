import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface ProjectInformationView {
	name: string;
	period: string;
	options: string;
	ratio: string;
	editLink: string | null | undefined;
}

/**
 * Objectif: Pilote l'identité du projet sélectionné dans les tests.
 * Périmètre: Indique si elle est affichée et lit le nom, la période, les options, leur ratio et le lien d'édition.
 * Limites: Ne suit pas le lien d'édition.
 */
export class ProjectInformationHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-information';

	private readonly table = this.locatorForOptional(byTestId('project-information-table'));
	private readonly nameText = this.locatorFor(byTestId('project-information-name'));
	private readonly periodText = this.locatorFor(byTestId('project-information-period'));
	private readonly optionsText = this.locatorFor(byTestId('project-information-options'));
	private readonly ratioTag = this.locatorFor(byTestId('project-information-options-tag'));
	private readonly editButton = this.locatorForOptional(byTestId('project-information-edit-button'));

	public async shown(): Promise<boolean> {
		return (await this.table()) !== null;
	}

	public async view(): Promise<ProjectInformationView> {
		const edit = await this.editButton();
		return {
			name: (await (await this.nameText()).text()).trim(),
			period: (await (await this.periodText()).text()).replace(/\s+/g, ' ').trim(),
			options: (await (await this.optionsText()).text()).trim(),
			ratio: (await (await this.ratioTag()).text()).trim(),
			editLink: edit ? await edit.getAttribute('href') : undefined,
		};
	}
}
