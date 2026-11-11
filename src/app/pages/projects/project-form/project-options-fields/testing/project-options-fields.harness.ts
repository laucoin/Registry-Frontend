import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export enum OptionsSelectionEnum {
	ALL = 'all',
	SOME = 'some',
	NONE = 'none',
}

export interface ProjectOptionView {
	label: string;
	checked: boolean;
	error: string | null;
}

/**
 * Objectif: Pilote le choix des options d'un projet dans les tests.
 * Périmètre: Lit chaque option (libellé, choisie, erreur) et l'état de la case « tout ».
 * Limites: Ne bascule rien : `sgdf-switch` ne se bascule pas au clic sous test, les specs cochent nativement.
 */
export class ProjectOptionsFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-options-fields';

	private readonly selectAllCheckbox = this.locatorFor(byTestId('project-options-fields-select-all-checkbox'));
	private readonly switches = this.locatorForAll(byTestId('project-options-fields-option-switch'));

	public async options(): Promise<ProjectOptionView[]> {
		return Promise.all(
			(await this.switches()).map(async (option) => ({
				label: (await option.text()).replace(/\s+/g, ' ').trim(),
				checked: await option.getProperty<boolean>('checked'),
				error: (await option.getAttribute('error')) || null,
			})),
		);
	}

	public async allState(): Promise<OptionsSelectionEnum> {
		const checkbox = await this.selectAllCheckbox();
		if (await checkbox.getProperty<boolean>('indeterminate')) return OptionsSelectionEnum.SOME;
		return (await checkbox.getProperty<boolean>('checked')) ? OptionsSelectionEnum.ALL : OptionsSelectionEnum.NONE;
	}
}
