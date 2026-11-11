import { ComponentHarness } from '@angular/cdk/testing';

import { ProjectFormStepperHarness } from '@pages/projects/project-form/project-form-stepper/testing/project-form-stepper.harness';
import { ProjectInformationFieldsHarness } from '@pages/projects/project-form/project-information-fields/testing/project-information-fields.harness';
import { ProjectOptionsFieldsHarness } from '@pages/projects/project-form/project-options-fields/testing/project-options-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SelectElementsFieldHarness } from '@shared/ui/common/select-elements-field/testing/select-elements-field.harness';

/**
 * Objectif: Pilote le formulaire de création et de modification d'un projet dans les tests.
 * Périmètre: Lit le titre, le chargement et l'erreur de chargement ; donne les étapes et les champs de chaque étape ;
 * passe d'une étape à l'autre, enregistre, invite des utilisateurs ou passe l'invitation.
 * Limites: Ne saisit pas les dates des invitations.
 */
export class ProjectFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-form';

	private readonly heading = this.locatorForOptional(byTestId('project-form-title'));
	private readonly spinner = this.locatorForOptional('sgdf-spinner');
	private readonly informationForm = this.locatorFor(byTestId('project-form-information-form'));
	private readonly optionsForm = this.locatorFor(byTestId('project-form-options-form'));
	private readonly invitationForm = this.locatorFor(byTestId('project-form-invitation-form'));
	private readonly cancelButton = this.locatorFor(byTestId('project-form-information-cancel-button'));
	private readonly previousButton = this.locatorFor(byTestId('project-form-options-previous-button'));
	private readonly skipButton = this.locatorFor(byTestId('project-form-invitation-skip-button'));
	private readonly createdCallout = this.locatorForOptional(byTestId('project-form-created-callout'));
	private readonly roleSelect = this.locatorFor(byTestId('project-profile-invitation-fields-role-select'));

	public readonly loadError = this.locatorForOptional(SectionErrorHarness);
	public readonly stepper = this.locatorForOptional(ProjectFormStepperHarness);
	public readonly information = this.locatorForOptional(ProjectInformationFieldsHarness);
	public readonly options = this.locatorForOptional(ProjectOptionsFieldsHarness);
	public readonly users = this.locatorFor(SelectElementsFieldHarness);

	public async title(): Promise<string | undefined> {
		return (await (await this.heading())?.text())?.trim();
	}

	public async loading(): Promise<boolean> {
		return (await this.spinner()) !== null;
	}

	public async next(): Promise<void> {
		return (await this.informationForm()).dispatchEvent('submit');
	}

	public async cancel(): Promise<void> {
		return (await this.cancelButton()).click();
	}

	public async previous(): Promise<void> {
		return (await this.previousButton()).click();
	}

	public async save(): Promise<void> {
		return (await this.optionsForm()).dispatchEvent('submit');
	}

	public async createdTitle(): Promise<string | undefined> {
		return (await this.createdCallout())?.getProperty<string>('title');
	}

	public async chooseRole(role: string): Promise<void> {
		const select = await this.roleSelect();
		await select.setInputValue(role);
		await select.dispatchEvent('change');
	}

	public async invite(): Promise<void> {
		return (await this.invitationForm()).dispatchEvent('submit');
	}

	public async skip(): Promise<void> {
		return (await this.skipButton()).click();
	}
}
