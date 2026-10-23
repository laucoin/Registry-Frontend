import { Component, OnDestroy} from '@angular/core'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {InputTextModule} from 'primeng/inputtext'
import {PaginatorModule} from 'primeng/paginator'
import {TranslocoPipe} from '@jsverse/transloco'
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import {ProjectProfilesDto} from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profiles.dto'
import {FormFieldErrorComponent} from '@shared/ui/common/form-field-error/form-field-error.component'
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
import {FormHelper} from '@shared/helpers/form.helper'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {UserHelper} from '@shared/helpers/user.helper'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'
import {UserModel} from '@shared/models/model/user.model'
import {RegistryValidators} from '@shared/helpers/registry.validator'

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
        ReactiveFormsModule,
        FormFieldErrorComponent,
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

    public constructor() {
        super()
    }

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            role: this.formBuilder.control(undefined, Validators.required),
            beginDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            endDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            users: this.formBuilder.control([], [Validators.required]),
        }, {
            validators: [RegistryValidators.beginDateBeforeEndDate('beginDateTime', 'endDateTime')],
        })
    }

    protected fillForm(): void {
        // do nothing
    }

    protected submit(): void {
        if (!FormHelper.isFormValid(this.form)) {
            this.logInvalidForm(this.form.value)
            return
        }

        if (this.saving()) return

        this.save(this.facade.createProjectProfiles(this.buildDto()))
    }

    protected buildDto(): ProjectProfilesDto {
        return {
            userIds: this.users.value.map((user: UserModel): string => user.id),
            role: this.role.value,
            startAccess: this.beginDateTime.value,
            endAccess: this.endDateTime.value,
        }
    }

    protected handleSearch(searched: string | undefined): void {
        this.facade.searchUsers(searched)
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected get users(): FormControl {
        return this.form.get('users') as FormControl
    }
}
