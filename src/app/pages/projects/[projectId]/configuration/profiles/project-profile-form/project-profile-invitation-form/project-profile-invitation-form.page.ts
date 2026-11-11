import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { GenericProjectProfileFormComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component';
import {
	createProjectProfileInvitationForm,
	toProjectProfileInvitationFormModel,
	toProjectProfilesDto,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form';
import { ProjectProfileInvitationFieldsComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/project-profile-invitation-fields.component';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { FormComponent } from '@shared/ui/common/form/form.component';
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component';

import '@sgdf/ui/card';

/**
 * Objectif: Page avec le formulaire d'invitation d'utilisateurs à des profils du projet sélectionné.
 * Périmètre: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limites: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-project-profile-invitation-form',
	imports: [
		TranslocoPipe,
		FormComponent,
		FormActionsComponent,
		PluralTranslationPipe,
		ProjectProfileInvitationFieldsComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-profile-invitation-form.page.html',
})
export class ProjectProfileInvitationFormPage extends GenericProjectProfileFormComponent {
	protected readonly model = signal(toProjectProfileInvitationFormModel());
	protected readonly form = createProjectProfileInvitationForm(this.model);

	constructor() {
		super();

		this.loadData();

		this.handleLoadedElement();
	}

	protected submit(): void {
		if (!this.canSubmit(undefined, () => this.isFormValid(this.form))) return;

		this.save(this.facade.createProjectProfiles(toProjectProfilesDto(this.model())));
	}
}
