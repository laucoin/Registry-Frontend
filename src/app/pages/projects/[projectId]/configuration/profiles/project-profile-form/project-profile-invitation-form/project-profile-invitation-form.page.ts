import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/card'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'
import { FieldTree } from '@angular/forms/signals'
import {
    createProjectProfileInvitationForm,
    ProjectProfileInvitationFormModel,
    toProjectProfileInvitationFormModel,
    toProjectProfilesDto,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {GenericProjectProfileFormComponent} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {ProjectProfileInvitationFieldsComponent} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-invitation-fields/project-profile-invitation-fields.component'

/**
 * Purpose: Page avec le formulaire de création ou d'édition d'une invitation à un profil de projet.
 * Scope: Construit le formulaire, le soumet via la facade et navigue en arrière.
 * Limits: Ne détient aucun état de domaine et n'appelle jamais le backend.
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
    protected readonly model: WritableSignal<ProjectProfileInvitationFormModel> = signal(toProjectProfileInvitationFormModel())
    protected readonly form: FieldTree<ProjectProfileInvitationFormModel> = createProjectProfileInvitationForm(this.model)

    public constructor() {
        super()

        this.loadData()
    }

    protected submit(): void {
        if (!this.isFormValid(this.form)) {
            return
        }

        if (this.saving()) return

        this.save(this.facade.createProjectProfiles(toProjectProfilesDto(this.model())))
    }
}
