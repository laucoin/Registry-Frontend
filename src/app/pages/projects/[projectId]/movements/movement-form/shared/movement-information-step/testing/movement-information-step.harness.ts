import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote l'étape des informations d'un mouvement dans les tests.
 * Périmètre: Lit les types proposés, l'état et l'erreur du type, choisit un type, passe à l'étape suivante ou annule.
 * Limites: Ne saisit pas la date.
 */
export class MovementInformationStepHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movement-information-step';

	private readonly form = this.locatorFor(byTestId('movement-information-step-form'));
	private readonly typeSelect = this.locatorFor(byTestId('movement-information-step-type-select'));
	private readonly typeOptions = this.locatorForAll(
		`${byTestId('movement-information-step-type-select')} sgdf-option`,
	);
	private readonly cancelButton = this.locatorFor(byTestId('movement-information-step-cancel-button'));

	public async types(): Promise<string[]> {
		return Promise.all(
			(await this.typeOptions()).map(async (option) => (await option.getProperty<string>('value')) ?? ''),
		);
	}

	public async typeDisabled(): Promise<boolean> {
		return (await this.typeSelect()).getProperty<boolean>('disabled');
	}

	public async typeError(): Promise<string | null> {
		return (await this.typeSelect()).getAttribute('error');
	}

	public async chooseType(type: string): Promise<void> {
		const select = await this.typeSelect();
		await select.setInputValue(type);
		await select.dispatchEvent('change');
	}

	public async next(): Promise<void> {
		return (await this.form()).dispatchEvent('submit');
	}

	public async cancel(): Promise<void> {
		return (await this.cancelButton()).click();
	}
}
