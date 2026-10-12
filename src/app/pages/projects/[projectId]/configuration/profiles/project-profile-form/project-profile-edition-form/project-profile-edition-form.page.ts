import { Component, OnDestroy, signal, WritableSignal } from '@angular/core'
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
import {CardModule} from 'primeng/card'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {UserElementComponent} from '@pages/users/user-element/user-element.component'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {GenericProjectProfileFormComponent} from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/generic-project-profile-form.component'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {Button} from 'primeng/button'
import {Select, SelectModule} from 'primeng/select'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'

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
        FormField,
        SelectModule,
        FieldErrorComponent,
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
            this.subscriptions.add(
                this.facade.fetchProjectProfile(this.idParam!).pipe(
                    withLoading(this.loading),
                ).subscribe((profile: ProjectProfileModel): void => {
                    this.projectProfile.set(profile)
                    this.model.set(toProjectProfileFormModel(profile))
                }),
            )
        }
    }

    protected submit(): void {
        if (!this.isFormValid(this.form)) {
            this.logInvalidForm(this.model())
            return
        }

        if (this.saving() || this.loading() || !this.projectProfile()) return

        this.save(this.facade.updateProjectProfile(this.projectProfile()!.id, toProjectProfileDto(this.model())))
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
