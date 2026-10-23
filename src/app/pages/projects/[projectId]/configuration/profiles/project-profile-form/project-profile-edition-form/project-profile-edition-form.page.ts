import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core'
import { FieldTree, FormField } from '@angular/forms/signals'
import {
    createProjectProfileForm,
    ProjectProfileFormModel,
    toProjectProfileDto,
    toProjectProfileFormModel,
} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile.form'
import {withLoading} from '@shared/helpers/rx.helper'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {ProjectProfileModel} from '@shared/models/model/project-profile.model'
import {TranslocoPipe} from '@jsverse/transloco'
import '@sgdf/ui/date-time-picker'
import '@sgdf/ui/option'
import '@sgdf/ui/select'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive'
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {UserElementComponent} from '@pages/users/user-element/user-element.component'
import {GenericProjectProfileFormComponent} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component'
import { ETagHelper } from '@shared/helpers/etag.helper'

/**
 * Purpose: Dialog page with the form to edit a project profile, opened over the profiles list.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-project-profile-edition-form',
    imports: [
        TranslocoPipe,
        FormField,
        FieldErrorComponent,
        UserElementComponent,
        FormDialogComponent,
        SgdfFieldDirective,
        FieldErrorDirective,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './project-profile-edition-form.page.html',
})
export class ProjectProfileEditionFormPage extends GenericProjectProfileFormComponent {
    protected override readonly closesToParentRoute: boolean = true
    protected readonly projectProfile: WritableSignal<ProjectProfileModel | undefined> = signal(undefined)
    protected readonly model: WritableSignal<ProjectProfileFormModel> = signal(toProjectProfileFormModel())
    protected readonly form: FieldTree<ProjectProfileFormModel> = createProjectProfileForm(this.model)

    public constructor() {
        super()

        this.loadData()
    }

    protected override loadData(): void {
        super.loadData()

        if (GenericHelper.nonNull(this.idParam)) {
            this.facade.fetchProjectProfile(this.idParam!).pipe(
                    withLoading(this.loading),
                ).pipe( takeUntilDestroyed( this.destroyRef ) ).subscribe((profile: ProjectProfileModel): void => {
                    this.projectProfile.set(profile)
                    this.model.set(toProjectProfileFormModel(profile))
                })
        }
    }

    protected submit(): void {
        if (!this.isFormValid(this.form)) {
            this.logInvalidForm(this.model())
            return
        }

        if (this.saving() || this.loading() || !this.projectProfile()) return

        this.save(this.facade.updateProjectProfile(this.projectProfile()!.id, toProjectProfileDto(this.model()), ETagHelper.ifMatch(this.projectProfile())))
    }
}
