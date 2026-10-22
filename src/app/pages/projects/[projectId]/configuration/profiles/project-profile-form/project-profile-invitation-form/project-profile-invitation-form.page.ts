import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, signal, WritableSignal } from '@angular/core'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/card'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/divider'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'
import { FieldTree, FormField } from '@angular/forms/signals'
import {
    createProjectProfileInvitationForm,
    ProjectProfileInvitationFormModel,
    toProjectProfileInvitationFormModel,
    toProjectProfilesDto,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {GenericProjectProfileFormComponent} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {UserHelper} from '@shared/helpers/user.helper'

/**
 * Purpose: Page with the form to create or edit a project profile invitation.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-project-profile-invitation-form',
    imports: [
        TranslocoPipe,
        FormField,
        FieldErrorComponent,
        FieldErrorDirective,
        FormComponent,
        FormActionsComponent,
        SgdfFieldDirective,
        SelectElementsFieldComponent,
        PluralTranslationPipe,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './project-profile-invitation-form.page.html',
})
export class ProjectProfileInvitationFormPage extends GenericProjectProfileFormComponent implements OnDestroy {
    protected readonly UserHelper: typeof UserHelper = UserHelper

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

    protected handleSearch(searched: string | undefined): void {
        this.facade.searchUsers(searched)
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
