import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote les champs de tri dans les tests.
 * Périmètre: Lit les choix proposés et la valeur affichée du champ et du sens de tri.
 * Limites: Ne sélectionne pas de valeur ; le formulaire hôte pilote le modèle.
 */
export class SortFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-sort-fields';

	private readonly bySelect = this.locatorFor(byTestId('sort-fields-by-select'));
	private readonly byOptions = this.locatorForAll(`${byTestId('sort-fields-by-select')} sgdf-option`);
	private readonly directionSelect = this.locatorFor(byTestId('sort-fields-direction-select'));
	private readonly directionOptions = this.locatorForAll(`${byTestId('sort-fields-direction-select')} sgdf-option`);

	public async fieldChoices(): Promise<string[]> {
		return valuesOf(await this.byOptions());
	}

	public async directionChoices(): Promise<string[]> {
		return valuesOf(await this.directionOptions());
	}

	public async field(): Promise<string> {
		return (await this.bySelect()).getProperty<string>('value');
	}

	public async direction(): Promise<string> {
		return (await this.directionSelect()).getProperty<string>('value');
	}
}

function valuesOf(options: TestElement[]): Promise<string[]> {
	return Promise.all(options.map((option) => option.getProperty<string>('value')));
}
