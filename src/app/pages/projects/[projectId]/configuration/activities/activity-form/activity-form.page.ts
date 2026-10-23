import { Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { FieldTree, FormField } from '@angular/forms/signals'
import {ActivityDto} from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import {
    ActivityFormModel,
    createActivityForm,
    toActivityDto,
    toActivityFormModel,
} from '@pages/projects/[projectId]/configuration/activities/activity-form/activity.form'
import {CustomDatetimeModel} from '@shared/models/model/custom-datetime.model'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormComponent} from '@shared/ui/common/form/form.component'
import {FieldErrorComponent} from '@shared/ui/common/field-error/field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslocoPipe} from '@jsverse/transloco'
import {ActivityModel} from '@shared/models/model/activity.model'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {ProjectModel} from '@shared/models/model/project.model'
import {Textarea} from 'primeng/textarea'
import {BaseFormComponent} from '@shared/ui/base/base-form.component'
import {withLoading} from '@shared/helpers/rx.helper'
import {DurationFieldComponent} from '@shared/ui/common/duration-field/duration-field.component'
import {
    NumberRangeFieldComponent,
} from '@shared/ui/common/number-range-field/number-range-field.component'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {GenericHelper} from '@shared/helpers/generic.helper'
import {DateTimeFieldComponent} from '@shared/ui/common/date-time-field/date-time-field.component'
import {FormIconPipe} from '@shared/helpers/pipe/form-icon.pipe'

/**
 * Purpose: Page with the form to create or edit a activity.
 * Scope: Builds the form, submits it through the facade and navigates back.
 * Limits: Holds no domain state and never calls the backend.
 */
@Component({
    selector: 'app-activity-form',
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FieldErrorComponent,
        InputTextModule,
        TranslocoPipe,
        FormField,
        RegistryRequiredDirective,
        Textarea,
        DurationFieldComponent,
        NumberRangeFieldComponent,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        DateTimeFieldComponent,
        FormIconPipe,
    ],
    templateUrl: './activity-form.page.html',
    styleUrl: './activity-form.page.css',
})
export class ActivityFormPage extends BaseFormComponent implements OnDestroy {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)

    protected readonly activity: WritableSignal<ActivityModel | undefined> = signal(undefined)
    protected readonly contextProject: WritableSignal<ProjectModel | undefined> = signal(undefined)
    protected readonly model: WritableSignal<ActivityFormModel> = signal(toActivityFormModel())
    protected readonly form: FieldTree<ActivityFormModel> = createActivityForm(this.model, {
        project: this.contextProject,
        formatDate: (date: CustomDatetimeModel): string | undefined => this.datePipe.transform(date),
    })

    public constructor() {
        super()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData(): void {
        if (GenericHelper.nonNull(this.idParam)) {
            this.subscriptions.add(
                this.facade.fetchActivity(this.idParam!).pipe(
                    withLoading(this.loading),
                ).subscribe( (activity: ActivityModel): void => {
                    this.activity.set(activity)
                    this.applyActivity(activity)
                } ),
            )
        }
    }

    protected handleLoadedElement(): void {
        if (!GenericHelper.nonNull(this.idParam)) {
            this.applyActivity(undefined)
        }
    }

    private applyActivity(activity: ActivityModel | undefined): void {
        this.contextProject.set(activity?.project || this.sessionFacade.selectedProject())
        if (activity) this.model.set(toActivityFormModel(activity))
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericHelper.nonNull(this.idParam)
        if (editing && !this.activity()) return

        if (!this.isFormValid(this.form)) {
            this.logInvalidForm(this.model())
            return
        }

        const dto: ActivityDto = toActivityDto(this.model())
        this.save(editing ? this.facade.updateActivity(this.activity()!.id, dto) : this.facade.createActivity(dto))
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['activityId']
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }
}
