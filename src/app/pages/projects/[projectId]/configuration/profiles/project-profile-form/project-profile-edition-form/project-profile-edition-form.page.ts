import { Component, OnDestroy} from '@angular/core'
import {FormGroup, ReactiveFormsModule, Validators} from '@angular/forms'
import {ProjectProfileDto} from '@pages/projects/[projectId]/configuration/profiles/data/dto/project-profile.dto'
import {ProjectProfileModel} from '@shared/models/model/project-profile.model'
import {FormHelper} from '@shared/helpers/form.helper'
import {TranslocoPipe} from '@jsverse/transloco'
import {CardModule} from 'primeng/card'
import {FormFieldErrorComponent} from '@shared/ui/common/form-field-error/form-field-error.component'
import {UserElementComponent} from '@pages/users/user-element/user-element.component'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {GenericProjectProfileFormComponent} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {Button} from 'primeng/button'
import {Select, SelectModule} from 'primeng/select'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'
import {RegistryValidators} from '@shared/helpers/registry.validator'

/**
 * Purpose: Page with the form to create or edit a project profile edition.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-project-profile-edition-form',
    imports: [
        TranslocoPipe,
        CardModule,
        ReactiveFormsModule,
        SelectModule,
        FormFieldErrorComponent,
        UserElementComponent,
        FormComponent,
        RegistryRequiredDirective,
        Button,
        Select,
        DateFormatPipe,
        DateTimeFieldComponent,
    ],
    templateUrl: './project-profile-edition-form.page.html',
})
export class ProjectProfileEditionFormPage extends GenericProjectProfileFormComponent implements OnDestroy {
    protected initForm(): FormGroup {
        return this.formBuilder.group({
            role: this.formBuilder.control(undefined, Validators.required),
            beginDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            endDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
        }, {
            validators: [RegistryValidators.beginDateBeforeEndDate('beginDateTime', 'endDateTime')],
        })
    }

    protected fillForm(element: ProjectProfileModel | undefined): void {
        if (!element) return
        this.role.patchValue(element?.role.value)
        this.beginDateTime.patchValue(element?.startAccess)
        this.endDateTime.patchValue(element?.endAccess)
    }

    protected submit(): void {
        if (!FormHelper.isFormValid(this.form)) {
            this.logInvalidForm(this.form.value)
            return
        }

        if (this.saving() || this.loading() || !this.projectProfile()) return

        this.save(this.facade.updateProjectProfile(this.projectProfile()!.id, this.buildDto()))
    }

    protected buildDto(): ProjectProfileDto {
        return {
            role: this.role.value,
            startAccess: this.beginDateTime.value,
            endAccess: this.endDateTime.value,
        }
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
