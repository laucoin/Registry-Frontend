import { ComponentHarness } from '@angular/cdk/testing';

import { ProjectProfileInvitationFieldsHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/testing/project-profile-invitation-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormHarness } from '@shared/ui/common/form/testing/form.harness';
import { FormActionsHarness } from '@shared/ui/common/form-actions/testing/form-actions.harness';

/**
 * Objectif: Pilote la page d'invitation à des profils de projet dans les tests.
 * Périmètre: Donne le cadre du formulaire, ses champs et ses boutons, et soumet le formulaire.
 * Limites: Les champs sont pilotés par leur propre harness.
 */
export class ProjectProfileInvitationFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-profile-invitation-form';

	private readonly submitForm = this.locatorFor(byTestId('project-profile-invitation-form-submit-form'));

	public readonly form = this.locatorFor(FormHarness);
	public readonly fields = this.locatorFor(ProjectProfileInvitationFieldsHarness);
	public readonly actions = this.locatorFor(FormActionsHarness);

	public async submit(): Promise<void> {
		return (await this.submitForm()).dispatchEvent('submit');
	}
}
