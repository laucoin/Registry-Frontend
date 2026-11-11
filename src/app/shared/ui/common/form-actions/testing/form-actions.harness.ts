import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote les boutons d'un formulaire de page dans les tests.
 * Périmètre: Lit le libellé, le type et l'état d'enregistrement du bouton de soumission, et annule.
 * Limites: Ne soumet pas le formulaire ; le formulaire englobant écoute la soumission.
 */
export class FormActionsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-form-actions';

	private readonly cancelButton = this.locatorFor(byTestId('form-actions-cancel-button'));
	private readonly submitButton = this.locatorFor(byTestId('form-actions-submit'));

	public async submitLabel(): Promise<string> {
		return (await (await this.submitButton()).text()).trim();
	}

	public async submits(): Promise<boolean> {
		return (await (await this.submitButton()).getAttribute('submit')) !== null;
	}

	public async cancelSubmits(): Promise<boolean> {
		return (await (await this.cancelButton()).getAttribute('submit')) !== null;
	}

	public async saving(): Promise<boolean> {
		return (await this.submitButton()).getProperty<boolean>('loading');
	}

	public async cancel(): Promise<void> {
		return (await this.cancelButton()).click();
	}
}
