import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le dialogue de confirmation dans les tests.
 * Périmètre: Lit l'état du dialogue (ouverture, titre, variante, message, phrase attendue) et le confirme, l'annule ou le ferme.
 * Limites: Ne simule pas la top layer ni le focus du dialogue natif.
 */
export class ConfirmationDialogHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-confirmation-dialog';

	private readonly dialog = this.locatorFor(byTestId('confirmation-dialog'));
	private readonly message = this.locatorFor(byTestId('confirmation-dialog-message'));
	private readonly phraseInput = this.locatorForOptional(byTestId('confirmation-dialog-phrase-input'));
	private readonly cancelButton = this.locatorFor(byTestId('confirmation-dialog-cancel-button'));
	private readonly confirmButton = this.locatorFor(byTestId('confirmation-dialog-confirm-button'));

	public async isOpen(): Promise<boolean> {
		return (await this.dialog()).getProperty<boolean>('open');
	}

	public async title(): Promise<string> {
		return (await this.dialog()).getProperty<string>('title');
	}

	public async variant(): Promise<string> {
		return (await this.dialog()).getProperty<string>('variant');
	}

	public async messageText(): Promise<string> {
		return (await this.message()).text();
	}

	public async asksForPhrase(): Promise<boolean> {
		return (await this.phraseInput()) !== null;
	}

	public async typePhrase(value: string): Promise<void> {
		const input = await this.phraseInput();
		if (input) await typeInto(input, value);
	}

	public async typedPhrase(): Promise<string | null> {
		return (await this.phraseInput())?.getProperty<string>('value') ?? null;
	}

	public async canConfirm(): Promise<boolean> {
		return !(await (await this.confirmButton()).getProperty<boolean>('disabled'));
	}

	public async confirm(): Promise<void> {
		return (await this.confirmButton()).click();
	}

	public async cancel(): Promise<void> {
		return (await this.cancelButton()).click();
	}

	public async dismiss(): Promise<void> {
		return (await this.dialog()).dispatchEvent('sgdf-hide');
	}
}
