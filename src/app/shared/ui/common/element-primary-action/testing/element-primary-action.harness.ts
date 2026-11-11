import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le bouton de l'action principale d'un élément de liste dans les tests.
 * Périmètre: Lit le libellé et l'indisponibilité de l'action, et clique sur le bouton.
 * Limites: Aucune.
 */
export class ElementPrimaryActionHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-element-primary-action';

	private readonly button = this.locatorFor(byTestId('element-primary-action-button'));

	public async label(): Promise<string> {
		return (await (await this.button()).text()).trim();
	}

	public async disabled(): Promise<boolean> {
		return (await (await this.button()).getAttribute('aria-disabled')) === 'true';
	}

	public async click(): Promise<void> {
		return (await this.button()).click();
	}
}
