import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { FormHarness } from '@shared/ui/common/form/testing/form.harness';
import { FormActionsHarness } from '@shared/ui/common/form-actions/testing/form-actions.harness';
import { GroupMembersFieldHarness } from '@shared/ui/domain/group-members-field/testing/group-members-field.harness';

/**
 * Objectif: Pilote la page du formulaire d'un groupe dans les tests.
 * Périmètre: Lit l'étape active et le nom, saisit le nom, soumet l'étape des informations puis celle des membres, lit
 * le titre du groupe créé et passe l'étape des membres.
 * Limites: Ne saisit pas les dates ; le choix des membres est piloté par le harness du champ des membres.
 */
export class GroupFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-group-form';

	private readonly stepper = this.locatorForOptional(byTestId('group-form-stepper'));
	private readonly nameInput = this.locatorForOptional(byTestId('group-form-name-input'));
	private readonly informationForm = this.locatorFor(byTestId('group-form-submit-form'));
	private readonly membersForm = this.locatorFor(byTestId('group-form-members-form'));
	private readonly created = this.locatorForOptional(byTestId('group-form-created-callout'));
	private readonly skipButton = this.locatorFor(byTestId('group-form-members-skip-button'));
	private readonly membersSubmit = this.locatorFor(byTestId('group-form-members-submit-button'));

	public readonly form = this.locatorFor(FormHarness);
	public readonly actions = this.locatorForOptional(FormActionsHarness);
	public readonly members = this.locatorForOptional(GroupMembersFieldHarness);

	public async activeStep(): Promise<string | undefined> {
		return (await (await this.stepper())?.getProperty<string>('active')) ?? undefined;
	}

	public async name(): Promise<string | undefined> {
		return (await (await this.nameInput())?.getProperty<string>('value')) ?? undefined;
	}

	public async typeName(value: string): Promise<void> {
		const input = await this.nameInput();
		if (input) await typeInto(input, value);
	}

	public async submit(): Promise<void> {
		return (await this.informationForm()).dispatchEvent('submit');
	}

	public async createdTitle(): Promise<string | undefined> {
		return (await (await this.created())?.getProperty<string>('title')) ?? undefined;
	}

	public async membersSaving(): Promise<boolean> {
		return (await this.membersSubmit()).getProperty<boolean>('loading');
	}

	public async addMembers(): Promise<void> {
		return (await this.membersForm()).dispatchEvent('submit');
	}

	public async skip(): Promise<void> {
		return (await this.skipButton()).click();
	}
}
