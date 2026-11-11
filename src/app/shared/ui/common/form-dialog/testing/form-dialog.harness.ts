import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormErrorHarness } from '@shared/ui/common/form-error/testing/form-error.harness';

/**
 * Objectif: Pilote le dialogue de formulaire dans les tests.
 * Périmètre: Lit le titre, le chargement et l'état du bouton de soumission, soumet le formulaire, annule, ferme le
 * dialogue et donne l'erreur du formulaire.
 * Limites: Ne lit pas les champs projetés ; le harness de la page les pilote.
 */
export class FormDialogHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-form-dialog';

	private readonly form = this.locatorFor(byTestId('form-dialog-form'));
	private readonly dialog = this.locatorFor(byTestId('form-dialog-modal'));
	private readonly spinner = this.locatorForOptional(byTestId('form-dialog-spinner'));
	private readonly cancelButton = this.locatorFor(byTestId('form-dialog-cancel-button'));
	private readonly submitButton = this.locatorFor(byTestId('form-dialog-submit'));
	private readonly dialogInForm = this.locatorForOptional(
		`${byTestId('form-dialog-form')} > ${byTestId('form-dialog-modal')}`,
	);

	public readonly error = this.locatorForOptional(FormErrorHarness);

	public async title(): Promise<string> {
		return (await this.dialog()).getProperty<string>('title');
	}

	public async insideForm(): Promise<boolean> {
		return (await this.dialogInForm()) !== null;
	}

	public async submitSubmits(): Promise<boolean> {
		return (await (await this.submitButton()).getAttribute('submit')) !== null;
	}

	public async loading(): Promise<boolean> {
		return (await this.spinner()) !== null;
	}

	public async submitDisabled(): Promise<boolean> {
		return (await this.submitButton()).getProperty<boolean>('disabled');
	}

	public async saving(): Promise<boolean> {
		return (await this.submitButton()).getProperty<boolean>('loading');
	}

	public async submit(): Promise<void> {
		return (await this.form()).dispatchEvent('submit');
	}

	public async cancel(): Promise<void> {
		return (await this.cancelButton()).click();
	}

	public async hide(): Promise<void> {
		return (await this.dialog()).dispatchEvent('sgdf-hide');
	}
}
