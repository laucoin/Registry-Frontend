import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, signal, WritableSignal } from '@angular/core'
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
 * Purpose: Page with the form to create or edit a project profile invitation.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
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
export class ProjectProfileInvitationFormPage extends GenericProjectProfileFormComponent implements OnDestroy {
    protected readonly model: WritableSignal<ProjectProfileInvitationFormModel> = signal(toProjectProfileInvitationFormModel())
    protected readonly form: FieldTree<ProjectProfileInvitationFormModel> = createProjectProfileInvitationForm(this.model)

    public constructor() {
        super()

        this.loadData()
    }

    protected submit(): void {
        if (!this.isFormValid(this.form)) {
            this.logInvalidForm(this.model())
            return
        }

        if (this.saving()) return

        this.save(this.facade.createProjectProfiles(toProjectProfilesDto(this.model())))
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
