import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { FormDialogHarness } from '@shared/ui/common/form-dialog/testing/form-dialog.harness';

export enum ActivityTextFieldEnum {
	NAME = 'name',
}

const FIELD_IDS: Record<ActivityTextFieldEnum, string> = {
	[ActivityTextFieldEnum.NAME]: 'activity-form-name-input',
};

/**
 * Objectif: Pilote le formulaire d'une activité dans les tests.
 * Périmètre: Donne le dialogue du formulaire, lit et saisit ses champs texte.
 * Limites: Ne saisit pas les dates ; le harness du dialogue pilote la soumission et la fermeture.
 */
export class ActivityFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-activity-form';

	public readonly dialog = this.locatorFor(FormDialogHarness);

	public async text(field: ActivityTextFieldEnum): Promise<string> {
		return (await (await this.locatorFor(byTestId(FIELD_IDS[field]))()).getProperty<string>('value')) ?? '';
	}

	public async type(field: ActivityTextFieldEnum, value: string): Promise<void> {
		return typeInto(await this.locatorFor(byTestId(FIELD_IDS[field]))(), value);
	}
}
