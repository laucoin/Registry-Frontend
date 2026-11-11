import { ComponentHarness } from '@angular/cdk/testing';

import { GuestListFieldsHarness } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-list-fields/testing/guest-list-fields.harness';
import { MovementInformationStepHarness } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-information-step/testing/movement-information-step.harness';
import { MovementReasonSelectHarness } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-reason-select/testing/movement-reason-select.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormHarness } from '@shared/ui/common/form/testing/form.harness';
import { SelectElementsFieldHarness } from '@shared/ui/common/select-elements-field/testing/select-elements-field.harness';

/**
 * Objectif: Pilote le formulaire de mouvement d'invités dans les tests.
 * Périmètre: Donne le formulaire, l'étape des informations et, à l'étape du contenu, le motif, les invités ou les
 * participants qui partent ; lit l'étape active et le bouton d'enregistrement, revient en arrière et enregistre.
 * Limites: Les harnesses des champs pilotent leur saisie.
 */
export class GuestMovementFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-guest-movement-form';

	private readonly stepper = this.locatorFor(byTestId('guest-movement-form-stepper'));
	private readonly contentForm = this.locatorFor(byTestId('guest-movement-form-content-form'));
	private readonly previousButton = this.locatorFor(byTestId('guest-movement-form-content-previous-button'));
	private readonly submitButton = this.locatorFor(byTestId('guest-movement-form-content-submit'));

	public readonly form = this.locatorFor(FormHarness);
	public readonly information = this.locatorForOptional(MovementInformationStepHarness);
	public readonly reason = this.locatorForOptional(MovementReasonSelectHarness);
	public readonly guests = this.locatorForOptional(GuestListFieldsHarness);
	public readonly participants = this.locatorForOptional(SelectElementsFieldHarness);

	public async activeStep(): Promise<string> {
		return (await (await this.stepper()).getProperty<string>('active')) ?? '';
	}

	public async submitText(): Promise<string> {
		return (await (await this.submitButton()).text()).trim();
	}

	public async previous(): Promise<void> {
		return (await this.previousButton()).click();
	}

	public async save(): Promise<void> {
		return (await this.contentForm()).dispatchEvent('submit');
	}
}
