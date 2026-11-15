import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { ParticipantUserSelectHarness } from '@pages/projects/[projectId]/configuration/participants/participant-user-select/testing/participant-user-select.harness';
import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { FormHarness } from '@shared/ui/common/form/testing/form.harness';
import { FormActionsHarness } from '@shared/ui/common/form-actions/testing/form-actions.harness';
import { SelectElementsFieldHarness } from '@shared/ui/common/select-elements-field/testing/select-elements-field.harness';

export enum ParticipantNameEnum {
	FIRST = 'first',
	LAST = 'last',
}

export interface ParticipantNameView {
	value: string;
	disabled: boolean;
	hint: string;
}

/**
 * Objectif: Pilote le formulaire d'un participant dans les tests.
 * Périmètre: Donne le formulaire, le choix de l'utilisateur, les groupes et les actions ; lit et saisit les noms,
 * indique si la période de présence est proposée et soumet le formulaire.
 * Limites: Ne saisit pas les dates.
 */
export class ParticipantFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-participant-form';

	private readonly submitForm = this.locatorFor(byTestId('participant-form-submit-form'));
	private readonly beginPicker = this.locatorForOptional(byTestId('participant-form-begin-date-time-picker'));

	public readonly form = this.locatorFor(FormHarness);
	public readonly user = this.locatorForOptional(ParticipantUserSelectHarness);
	public readonly groups = this.locatorForOptional(SelectElementsFieldHarness);
	public readonly actions = this.locatorFor(FormActionsHarness);

	public async name(name: ParticipantNameEnum): Promise<ParticipantNameView> {
		const input = await this.nameInput(name);
		return {
			value: (await input.getProperty<string>('value')) ?? '',
			disabled: await input.getProperty<boolean>('disabled'),
			hint: (await input.getProperty<string>('hint')) ?? '',
		};
	}

	public async typeName(name: ParticipantNameEnum, value: string): Promise<void> {
		return typeInto(await this.nameInput(name), value);
	}

	public async periodShown(): Promise<boolean> {
		return (await this.beginPicker()) !== null;
	}

	public async submit(): Promise<void> {
		return (await this.submitForm()).dispatchEvent('submit');
	}

	private async nameInput(name: ParticipantNameEnum): Promise<TestElement> {
		return this.locatorFor(byTestId(`participant-form-${name}-name-input`))();
	}
}
