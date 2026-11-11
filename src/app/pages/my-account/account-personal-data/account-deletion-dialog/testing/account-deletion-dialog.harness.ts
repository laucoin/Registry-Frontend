import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le dialogue de confirmation de la suppression du compte dans les tests.
 * Périmètre: Lit l'ouverture du dialogue, la saisie et l'état du bouton de suppression ; saisit la phrase, confirme,
 * annule ou ferme le dialogue.
 * Limites: Ne lit pas le texte d'explication. `sgdf-dialog` garde `open` pendant son animation de fermeture : la
 * fermeture se vérifie sur l'état de l'hôte.
 */
export class AccountDeletionDialogHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-account-deletion-dialog';

	private readonly modal = this.locatorFor(byTestId('account-deletion-dialog-modal'));
	private readonly input = this.locatorFor(byTestId('account-deletion-dialog-type-to-confirm-input'));
	private readonly acceptButton = this.locatorFor(byTestId('account-deletion-dialog-accept-button'));
	private readonly cancelButton = this.locatorFor(byTestId('account-deletion-dialog-cancel-button'));

	public async isOpen(): Promise<boolean> {
		return (await this.modal()).getProperty<boolean>('open');
	}

	public async typedText(): Promise<string> {
		return (await this.input()).getProperty<string>('value');
	}

	public async type(text: string): Promise<void> {
		return typeInto(await this.input(), text);
	}

	public async acceptDisabled(): Promise<boolean> {
		return (await this.acceptButton()).getProperty<boolean>('disabled');
	}

	public async accept(): Promise<void> {
		return (await this.acceptButton()).click();
	}

	public async cancel(): Promise<void> {
		return (await this.cancelButton()).click();
	}

	public async hide(): Promise<void> {
		return (await this.modal()).dispatchEvent('sgdf-hide');
	}
}
