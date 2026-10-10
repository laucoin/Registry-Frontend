import { Component, OnDestroy, signal, WritableSignal } from '@angular/core'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {InputTextModule} from 'primeng/inputtext'
import {PaginatorModule} from 'primeng/paginator'
import {TranslocoPipe} from '@jsverse/transloco'
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
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {SelectModule} from 'primeng/select'
import {Button} from 'primeng/button'
import {TreeTableModule} from 'primeng/treetable'
import {TableModule} from 'primeng/table'
import {
    SelectElementsFieldComponent,
} from '@shared/ui/common/select-elements-field/select-elements-field.component'
import {PluralTranslationPipe} from '@shared/helpers/pipe/plural-translation.pipe'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {UserHelper} from '@shared/helpers/user.helper'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'

/**
 * Purpose: Page with the form to create or edit a project profile invitation.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-project-profile-invitation-form',
    imports: [
        CardModule,
        DividerModule,
        InputTextModule,
        PaginatorModule,
        TranslocoPipe,
        FormField,
        FieldErrorComponent,
        FormComponent,
        RegistryRequiredDirective,
        SelectModule,
        Button,
        TreeTableModule,
        TableModule,
        SelectElementsFieldComponent,
        PluralTranslationPipe,
        DateFormatPipe,
        DateTimeFieldComponent,
    ],
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
