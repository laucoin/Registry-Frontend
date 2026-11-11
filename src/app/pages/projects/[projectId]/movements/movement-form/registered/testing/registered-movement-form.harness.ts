import { ComponentHarness } from '@angular/cdk/testing';

import { RegisteredParticipantsFieldsHarness } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-participants-fields/testing/registered-participants-fields.harness';
import { RegisteredVehiclesFieldsHarness } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-vehicles-fields/testing/registered-vehicles-fields.harness';
import { MovementInformationStepHarness } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-information-step/testing/movement-information-step.harness';
import { MovementReasonSelectHarness } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-reason-select/testing/movement-reason-select.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormHarness } from '@shared/ui/common/form/testing/form.harness';

export enum RegisteredStepEnum {
	CONTENT = 'content',
	VEHICLES = 'vehicles',
}

/**
 * Objectif: Pilote le formulaire de mouvement de participants inscrits dans les tests.
 * Périmètre: Donne le formulaire, l'étape des informations, le motif, les participants et les véhicules ; lit les étapes
 * proposées, l'étape active et le bouton de l'étape du contenu ; valide une étape et revient en arrière.
 * Limites: Les harnesses des champs pilotent leur saisie.
 */
export class RegisteredMovementFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-registered-movement-form';

	private readonly stepper = this.locatorFor(byTestId('registered-movement-form-stepper'));
	private readonly stepElements = this.locatorForAll(`${byTestId('registered-movement-form-stepper')} sgdf-step`);
	private readonly contentSubmit = this.locatorFor(byTestId('registered-movement-form-content-next-submit'));

	public readonly form = this.locatorFor(FormHarness);
	public readonly information = this.locatorForOptional(MovementInformationStepHarness);
	public readonly reason = this.locatorForOptional(MovementReasonSelectHarness);
	public readonly participants = this.locatorForOptional(RegisteredParticipantsFieldsHarness);
	public readonly vehicles = this.locatorForOptional(RegisteredVehiclesFieldsHarness);

	public async steps(): Promise<string[]> {
		return Promise.all((await this.stepElements()).map(async (step) => (await step.getAttribute('name')) ?? ''));
	}

	public async activeStep(): Promise<string> {
		return (await (await this.stepper()).getProperty<string>('active')) ?? '';
	}

	public async contentSubmitText(): Promise<string> {
		return (await (await this.contentSubmit()).text()).trim();
	}

	public async submit(step: RegisteredStepEnum): Promise<void> {
		return (await this.locatorFor(byTestId(`registered-movement-form-${step}-form`))()).dispatchEvent('submit');
	}

	public async previous(step: RegisteredStepEnum): Promise<void> {
		return (await this.locatorFor(byTestId(`registered-movement-form-${step}-previous-button`))()).click();
	}
}
