import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal, WritableSignal } from '@angular/core'
import {ActivityFacade} from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms'
import {RegistryValidators} from '@shared/helpers/util/registry.validator'
import {ActivityDto} from '@pages/projects/[projectId]/configuration/activities/data/dto/activity.dto'
import {Button} from 'primeng/button'
import {CardModule} from 'primeng/card'
import {DividerModule} from 'primeng/divider'
import {FormComponent} from '@shared/ui/form/form.component'
import {FormFieldErrorComponent} from '@shared/ui/form-field-error/form-field-error.component'
import {InputTextModule} from 'primeng/inputtext'
import {TranslatePipe} from '@ngx-translate/core'
import {FormUtil} from '@shared/helpers/util/form.util'
import {ActivityModel} from '@shared/models/model/activity.model'
import {RegistryRequiredDirective} from '@shared/directives/registry-required.directive'
import {ProjectModel} from '@shared/models/model/project.model'
import {DateUtil} from '@shared/helpers/util/date.util'
import {Textarea} from 'primeng/textarea'
import {GenericFormComponent} from '@shared/ui/base/generic-form.component'
import {withLoading} from '@shared/helpers/util/rx.util'
import {DurationFieldComponent} from '@shared/ui/duration-field/duration-field.component'
import {
    NumberRangeFieldComponent,
} from '@shared/ui/number-range-field/number-range-field.component'
import {DateFormatPipe} from '@shared/helpers/pipe/date-format.pipe'
import {FormTitlePipe} from '@shared/helpers/pipe/form-title.pipe'
import {FormButtonPipe} from '@shared/helpers/pipe/form-button.pipe'
import {GenericUtil} from '@shared/helpers/util/generic.util'
import {DateTimeFieldComponent} from '@shared/ui/date-time-field/date-time-field.component'
import {FormIconPipe} from '@shared/helpers/pipe/form-icon.pipe'

@Component({
	changeDetection: ChangeDetectionStrategy.Eager,
    selector: 'app-activity-form',
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        TranslatePipe,
        ReactiveFormsModule,
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
    templateUrl: './activity-form.component.html',
    styleUrl: './activity-form.component.scss',
})
export class ActivityFormComponent extends GenericFormComponent<ActivityModel, ActivityDto> implements OnDestroy {
    protected readonly facade: ActivityFacade = inject(ActivityFacade)

    protected readonly form: FormGroup
    protected readonly activity: WritableSignal<ActivityModel | undefined> = signal(undefined)

    public constructor() {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData(): void {
        if (GenericUtil.nonNull(this.idParam)) {
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

    protected initForm(): FormGroup {
        return this.formBuilder.group({
            name: this.formBuilder.control(
                undefined,
                [Validators.required, Validators.maxLength(150), RegistryValidators.nonBlank()],
            ),
            description: this.formBuilder.control(
                undefined,
                [Validators.maxLength(2000)],
            ),
            duration: this.formBuilder.control(undefined, []),
            allowedParticipants: this.formBuilder.control(
                undefined,
                [
                    RegistryValidators.numericRange(),
                    RegistryValidators.numericRangeMin(1),
                    RegistryValidators.numericRangeMax(2147483647),
                    RegistryValidators.numericRangeBothDefined(),
                ],
            ),
            beginDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
            endDateTime: this.formBuilder.control(undefined, [RegistryValidators.dateRequiredForTime()]),
        }, {
            validators: [RegistryValidators.beginDateBeforeEndDate('beginDateTime', 'endDateTime')],
        })
    }

    protected handleLoadedElement(): void {
        if (!GenericUtil.nonNull(this.idParam)) {
            this.applyActivity(undefined)
        }
    }

    private applyActivity(activity: ActivityModel | undefined): void {
        const contextProject: ProjectModel | undefined = activity?.project || this.registryFacade.selectedProject()
        this.addProjectDateValidators(contextProject, this.beginDateTime)
        this.addProjectDateValidators(contextProject, this.endDateTime)
        this.fillForm(activity)
    }

    protected fillForm(element: ActivityModel | undefined): void {
        if (!element) return

        this.name.patchValue(element.name)
        this.description.patchValue(element.description)

        this.duration.patchValue(DateUtil.parseIsoDuration(element.duration?.value))

        this.allowedParticipants.patchValue(element.allowedParticipants)

        this.beginDateTime.patchValue(element.startAvailability)
        this.endDateTime.patchValue(element.endAvailability)
    }

    protected submit(): void {
        if (this.saving() || this.loading()) return

        const editing: boolean = GenericUtil.nonNull(this.idParam)
        if (editing && !this.activity()) return

        if (!FormUtil.isFormValid(this.form)) {
            this.logInvalidForm(this.form.value)
            return
        }

        const dto: ActivityDto = this.buildDto()
        this.save(editing ? this.facade.updateActivity(this.activity()!.id, dto) : this.facade.createActivity(dto))
    }

    protected buildDto(): ActivityDto {
        return {
            name: this.name.value,
            description: this.description.value,
            duration: this.duration.value ? DateUtil.toIsoDuration(
                this.duration.value.hours,
                this.duration.value.minutes,
            ) : undefined,
            allowedParticipants: this.allowedParticipants.value,
            startAvailability: this.beginDateTime.value,
            endAvailability: this.endDateTime.value,
        }
    }

    protected get idParam(): string | undefined {
        return this.route.snapshot.params['activityId']
    }

    public ngOnDestroy(): void {
        this.subscriptions.unsubscribe()
    }

    protected get name(): FormControl {
        return this.form.get('name') as FormControl
    }

    protected get description(): FormControl {
        return this.form.get('description') as FormControl
    }

    protected get duration(): FormControl {
        return this.form.get('duration') as FormControl
    }

    protected get allowedParticipants(): FormControl {
        return this.form.get('allowedParticipants') as FormControl
    }

    protected get beginDateTime(): FormControl {
        return this.form.get('beginDateTime') as FormControl
    }

    protected get endDateTime(): FormControl {
        return this.form.get('endDateTime') as FormControl
    }
}
