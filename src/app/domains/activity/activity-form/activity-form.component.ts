import { Component, inject, OnDestroy } from '@angular/core'
import { AppRouteEnum } from '../../../app-route.enum'
import { ActivityFacade } from '../data/state/activity.facade'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { RegistryValidators } from '../../../shared/util-tool/util/registry.validator'
import { ActivityDto } from '../data/dto/activity.dto'
import { Button } from 'primeng/button'
import { CardModule } from 'primeng/card'
import { DividerModule } from 'primeng/divider'
import { FormComponent } from '../../../shared/util-ui/form/form.component'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { InputTextModule } from 'primeng/inputtext'
import { TranslateModule } from '@ngx-translate/core'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { ActivityModel } from '../../../shared/util-model/model/activity.model'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { DateUtil } from '../../../shared/util-tool/util/date.util'
import { Textarea } from 'primeng/textarea'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { combineLatest, map, Observable } from 'rxjs'
import { CreateActivity, UpdateActivity } from '../data/state/activity.action'
import { DurationFieldComponent } from '../../../shared/util-ui/duration-field/duration-field.component'
import { NumberRangeFieldComponent } from '../../../shared/util-ui/number-range-field/number-range-field.component'
import { DateFormatPipe } from '../../../shared/util-tool/pipe/date-format.pipe'
import { FormTitlePipe } from '../../../shared/util-tool/pipe/form-title.pipe'
import { FormButtonPipe } from '../../../shared/util-tool/pipe/form-button.pipe'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { DateTimeFieldComponent } from '../../../shared/util-ui/date-time-field/date-time-field.component'

@Component( {
    selector: 'app-activity-form',
    standalone: true,
    imports: [
        Button,
        CardModule,
        DividerModule,
        FormComponent,
        FormFieldErrorComponent,
        FormsModule,
        InputTextModule,
        TranslateModule,
        ReactiveFormsModule,
        RegistryRequiredDirective,
        Textarea,
        DurationFieldComponent,
        NumberRangeFieldComponent,
        DateFormatPipe,
        FormTitlePipe,
        FormButtonPipe,
        DateTimeFieldComponent,
    ],
    templateUrl: './activity-form.component.html',
    styleUrl: './activity-form.component.scss',
} )
export class ActivityFormComponent extends GenericFormComponent<ActivityModel, ActivityDto> implements OnDestroy {
    protected readonly facade: ActivityFacade = inject( ActivityFacade )

    protected readonly form: FormGroup

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetActivity()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchActivity( this.idParam!, this.contextEventId() )
        } else {
            super.loadData()
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            name: this.formBuilder.control(
                undefined,
                [ Validators.required, Validators.maxLength( 150 ), RegistryValidators.nonBlank() ],
            ),
            description: this.formBuilder.control(
                undefined,
                [ Validators.maxLength( 2000 ) ],
            ),
            duration: this.formBuilder.control( undefined, [] ),
            allowedParticipants: this.formBuilder.control(
                undefined,
                [
                    RegistryValidators.numericRange(),
                    RegistryValidators.numericRangeMin( 1 ),
                    RegistryValidators.numericRangeMax( 2147483647 ),
                    RegistryValidators.numericRangeBothDefined(),
                ],
            ),
            beginDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
            endDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
        }, {
            validators: [ RegistryValidators.beginDateBeforeEndDate( 'beginDateTime', 'endDateTime' ) ],
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            combineLatest( [ this.facade.activity$, this.registryFacade.contextEvent$ ] ).pipe(
                map( ([ activity, event ]: [ ActivityModel | undefined, EventModel | undefined ]): void => {
                    const contextEvent: EventModel | undefined = activity?.event || event
                    this.addEventDateValidators( contextEvent, this.beginDateTime )
                    this.addEventDateValidators( contextEvent, this.endDateTime )
                    this.fillForm( activity )
                } ),
            ).subscribe(),
        )
    }

    protected fillForm (element: ActivityModel | undefined): void {
        if (!element) return

        this.name.patchValue( element.name )
        this.description.patchValue( element.description )

        this.duration.patchValue( DateUtil.parseIsoDuration( element.duration?.value ) )

        this.allowedParticipants.patchValue( element.allowedParticipants )

        this.beginDateTime.patchValue( element.startAvailability )
        this.endDateTime.patchValue( element.endAvailability )
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form )) {
            console.warn( this.invalidFormMessage, this.form.value )
            return
        }

        const dto: ActivityDto = this.buildDto()
        const observable: Observable<CreateActivity | UpdateActivity> =
            this.facade.activity()
            ? this.facade.updateActivity( this.facade.activity()!.id!, dto, this.contextEventId() )
            : this.facade.createActivity( dto, this.contextEventId() )

        this.subscriptions.add(
            observable.pipe(
                map( (): void => this.navigateToRedirectUri( AppRouteEnum.ACTIVITIES ) ),
            ).subscribe(),
        )
    }

    protected buildDto (): ActivityDto {
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

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['activityId']
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected get name (): FormControl {
        return this.form.get( 'name' ) as FormControl
    }

    protected get description (): FormControl {
        return this.form.get( 'description' ) as FormControl
    }

    protected get duration (): FormControl {
        return this.form.get( 'duration' ) as FormControl
    }

    protected get allowedParticipants (): FormControl {
        return this.form.get( 'allowedParticipants' ) as FormControl
    }

    protected get beginDateTime (): FormControl {
        return this.form.get( 'beginDateTime' ) as FormControl
    }

    protected get endDateTime (): FormControl {
        return this.form.get( 'endDateTime' ) as FormControl
    }
}
