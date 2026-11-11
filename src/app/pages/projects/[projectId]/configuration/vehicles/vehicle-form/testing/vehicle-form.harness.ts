import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { FormDialogHarness } from '@shared/ui/common/form-dialog/testing/form-dialog.harness';

export enum VehicleTextFieldEnum {
	LICENSE_PLATE = 'licensePlate',
	BRAND = 'brand',
	MODEL = 'model',
}

const FIELD_IDS: Record<VehicleTextFieldEnum, string> = {
	[VehicleTextFieldEnum.LICENSE_PLATE]: 'vehicle-form-license-plate-input',
	[VehicleTextFieldEnum.BRAND]: 'vehicle-form-brand-input',
	[VehicleTextFieldEnum.MODEL]: 'vehicle-form-model-input',
};

/**
 * Objectif: Pilote le formulaire d'un véhicule dans les tests.
 * Périmètre: Donne le dialogue du formulaire, lit et saisit ses champs texte.
 * Limites: Ne saisit pas les dates ; le harness du dialogue pilote la soumission et la fermeture.
 */
export class VehicleFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-vehicle-form';

	public readonly dialog = this.locatorFor(FormDialogHarness);

	public async text(field: VehicleTextFieldEnum): Promise<string> {
		return (await (await this.locatorFor(byTestId(FIELD_IDS[field]))()).getProperty<string>('value')) ?? '';
	}

	public async type(field: VehicleTextFieldEnum, value: string): Promise<void> {
		return typeInto(await this.locatorFor(byTestId(FIELD_IDS[field]))(), value);
	}
}
