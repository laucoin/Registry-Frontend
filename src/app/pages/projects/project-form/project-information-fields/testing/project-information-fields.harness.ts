import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote les champs d'information d'un projet dans les tests.
 * Périmètre: Lit et saisit le nom, lit son erreur et la présence des champs de dates.
 * Limites: Ne saisit pas les dates.
 */
export class ProjectInformationFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-information-fields';

	private readonly nameInput = this.locatorFor(byTestId('project-information-fields-name-input'));
	private readonly dates = this.locatorForAll(
		byTestId('project-information-fields-begin-date-time-picker'),
		byTestId('project-information-fields-end-date-time-picker'),
	);

	public async name(): Promise<string> {
		return (await this.nameInput()).getProperty<string>('value');
	}

	public async typeName(name: string): Promise<void> {
		return typeInto(await this.nameInput(), name);
	}

	public async nameError(): Promise<string | null> {
		return (await this.nameInput()).getAttribute('error');
	}

	public async datesShown(): Promise<number> {
		return (await this.dates()).length;
	}
}
