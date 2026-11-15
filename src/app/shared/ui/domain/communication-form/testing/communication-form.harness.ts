import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { FieldErrorHarness } from '@shared/ui/common/field-error/testing/field-error.harness';
import { FormErrorHarness } from '@shared/ui/common/form-error/testing/form-error.harness';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { CommunicationFieldMenuHarness } from '@shared/ui/domain/communication-form/communication-field-menu/testing/communication-field-menu.harness';
import { CommunicationLinkSelectHarness } from '@shared/ui/domain/communication-form/communication-link-select/testing/communication-link-select.harness';
import { CommunicationNewAlertFieldHarness } from '@shared/ui/domain/communication-form/communication-new-alert-field/testing/communication-new-alert-field.harness';

/**
 * Objectif: Pilote le formulaire de communication dans les tests.
 * Périmètre: Donne ses erreurs, ses champs de liaison et son menu ; saisit et lit le message, soumet (bouton ou
 * raccourci), réinitialise une édition et lit l'état du bouton de soumission.
 * Limites: Les champs de liaison et le menu sont pilotés par leurs propres harnesses.
 */
export class CommunicationFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-communication-form';

	private readonly message = this.locatorFor(byTestId('communication-form-message-textarea'));
	private readonly submitButton = this.locatorFor(byTestId('communication-form-submit-button'));
	private readonly resetButton = this.locatorForOptional(byTestId('communication-form-reset-form-button'));
	private readonly hint = this.locatorFor(byTestId('communication-form-hint'));

	public readonly loadError = this.locatorForOptional(
		new HarnessPredicate(SectionErrorHarness, { selector: byTestId('communication-form-load-error') }),
	);
	public readonly searchError = this.locatorForOptional(
		new HarnessPredicate(SectionErrorHarness, { selector: byTestId('communication-form-search-error') }),
	);
	public readonly submitError = this.locatorFor(FormErrorHarness);
	public readonly linkError = this.locatorFor(FieldErrorHarness);
	public readonly movementField = this.locatorForOptional(
		new HarnessPredicate(CommunicationLinkSelectHarness, {
			selector: byTestId('communication-form-movement-field'),
		}),
	);
	public readonly alertField = this.locatorForOptional(
		new HarnessPredicate(CommunicationLinkSelectHarness, { selector: byTestId('communication-form-alert-field') }),
	);
	public readonly newAlertField = this.locatorForOptional(CommunicationNewAlertFieldHarness);
	public readonly menu = this.locatorForOptional(CommunicationFieldMenuHarness);

	public async typeMessage(text: string): Promise<void> {
		return typeInto(await this.message(), text);
	}

	public async messageValue(): Promise<string> {
		return (await this.message()).getProperty<string>('value');
	}

	public async submit(): Promise<void> {
		return (await this.submitButton()).click();
	}

	public async pressOnMessage(init: { key: string; ctrlKey?: boolean; metaKey?: boolean }): Promise<void> {
		return (await this.message()).dispatchEvent('keydown', init);
	}

	public async submitIcon(): Promise<string> {
		return (await this.submitButton()).getProperty<string>('name');
	}

	public async submitDisabled(): Promise<boolean> {
		return (await this.submitButton()).getProperty<boolean>('disabled');
	}

	public async hintText(): Promise<string> {
		return (await this.hint()).text();
	}

	public async canReset(): Promise<boolean> {
		return (await this.resetButton()) !== null;
	}

	public async reset(): Promise<void> {
		return (await this.resetButton())?.click();
	}
}
