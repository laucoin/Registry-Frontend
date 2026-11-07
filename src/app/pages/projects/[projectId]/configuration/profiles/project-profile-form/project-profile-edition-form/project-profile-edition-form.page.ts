import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { GenericProjectProfileFormComponent } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component';
import {
	createProjectProfileForm,
	toProjectProfileDto,
	toProjectProfileFormModel,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form';
import { UserElementComponent } from '@pages/users/user-element/user-element.component';
import { FieldErrorDirective } from '@shared/directives/field-error.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { withLoading } from '@shared/helpers/rx.helper';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Purpose: Page en dialogue avec le formulaire d'édition d'un profil de projet, ouverte au-dessus de la liste des profils.
 * Scope: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
 */
@Component({
	selector: 'app-project-profile-edition-form',
	imports: [
		TranslocoPipe,
		FormField,
		UserElementComponent,
		FormDialogComponent,
		SgdfFieldDirective,
		FieldErrorDirective,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-profile-edition-form.page.html',
})
export class ProjectProfileEditionFormPage extends GenericProjectProfileFormComponent {
	protected override readonly closesToParentRoute: boolean = true;
	protected readonly projectProfile: WritableSignal<ProjectProfileModel | undefined> = signal(undefined);
	protected readonly model = signal(toProjectProfileFormModel());
	protected readonly form = createProjectProfileForm(this.model);

	constructor() {
		super();

		this.loadData();
	}

	protected override loadData(): void {
		super.loadData();

		if (GenericHelper.nonNull(this.idParam)) {
			this.facade
				.fetchProjectProfile(this.idParam)
				.pipe(withLoading(this.loading))
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe((profile) => {
					this.projectProfile.set(profile);
					this.model.set(toProjectProfileFormModel(profile));
				});
		}
	}

	protected submit(): void {
		if (!this.isFormValid(this.form)) {
			return;
		}

		const projectProfile: ProjectProfileModel | undefined = this.projectProfile();
		if (this.saving() || this.loading() || !projectProfile) return;

		this.save(
			this.facade.updateProjectProfile(
				projectProfile.id,
				toProjectProfileDto(this.model()),
				ETagHelper.ifMatch(projectProfile),
			),
		);
	}
}
