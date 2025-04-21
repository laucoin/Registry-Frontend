import { Component, inject, OnDestroy } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { EventDto } from '../data/dto/event.dto'
import { EventFacade } from '../data/state/event.facade'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { AppRouteEnum } from '../../../app-route.enum'
import { RegistryValidators } from '../../../shared/util-tool/util/registry.validator'
import { combineLatest, filter, map, Observable, tap } from 'rxjs'
import { EventOptionModel } from '../data/model/event-option.model'
import { ArrayUtil } from '../../../shared/util-tool/util/array.util'
import { SelectItem } from 'primeng/api'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { CreateEvent, UpdateEvent } from '../data/state/event.action'
import { Checkbox, CheckboxChangeEvent } from 'primeng/checkbox'
import { GenericUtil } from '../../../shared/util-tool/util/generic.util'
import { Step, StepItem, StepPanel, Stepper } from 'primeng/stepper'
import { Button } from 'primeng/button'
import { TranslatePipe } from '@ngx-translate/core'
import { PluralTranslationPipe } from '../../../shared/util-tool/pipe/plural-translation.pipe'
import { FormFieldErrorComponent } from '../../../shared/util-ui/form-field-error/form-field-error.component'
import { DateTimeFieldComponent } from '../../../shared/util-ui/date-time-field/date-time-field.component'
import { RegistryRequiredDirective } from '../../../shared/util-tool/directive/registry-required.directive'
import { DateFormatPipe } from '../../../shared/util-tool/pipe/date-format.pipe'
import { InputText } from 'primeng/inputtext'
import { Divider } from 'primeng/divider'
import { EventOptionIconPipe } from '../../../shared/util-tool/pipe/event-option-icon.pipe'
import { Message } from 'primeng/message'
import { FormButtonPipe } from '../../../shared/util-tool/pipe/form-button.pipe'
import { ProgressSpinner } from 'primeng/progressspinner'
import { FormTitlePipe } from '../../../shared/util-tool/pipe/form-title.pipe'
import { FormIconPipe } from '../../../shared/util-tool/pipe/form-icon.pipe'

@Component( {
    selector: 'app-event-form',
    imports: [
        Stepper,
        StepItem,
        Step,
        StepPanel,
        Button,
        TranslatePipe,
        PluralTranslationPipe,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        DateTimeFieldComponent,
        RegistryRequiredDirective,
        DateFormatPipe,
        InputText,
        Checkbox,
        Divider,
        EventOptionIconPipe,
        Message,
        FormsModule,
        FormButtonPipe,
        ProgressSpinner,
        FormTitlePipe,
        FormIconPipe,
    ],
    templateUrl: './event-form.component.html',
    styleUrl: './event-form.component.scss',
} )
export class EventFormComponent extends GenericFormComponent<EventModel, EventDto> implements OnDestroy {
    protected readonly facade: EventFacade = inject( EventFacade )

    protected readonly form: FormGroup
    protected readonly optionsForm: FormGroup = this.formBuilder.group( {} )
    protected readonly nextNavigation: AppRouteEnum = AppRouteEnum.EVENTS
    protected allSelected: boolean | undefined = false
    protected activeTab: number = 1

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
        this.handleOptionsChange()
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    protected override loadData (): void {
        this.facade.resetEvent()
        this.facade.fetchEventOptions()

        if (GenericUtil.nonNull( this.idParam )) {
            this.facade.fetchEvent( this.idParam! )
        }
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            name: this.formBuilder.control(
                undefined,
                [ Validators.required, RegistryValidators.nonBlank(), Validators.maxLength( 150 ) ],
            ),
            beginDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
            endDateTime: this.formBuilder.control( undefined, [ RegistryValidators.dateRequiredForTime() ] ),
        }, {
            validators: [ RegistryValidators.beginDateBeforeEndDate( 'beginDateTime', 'endDateTime' ) ],
        } )
    }

    protected handleLoadedElement (): void {
        this.subscriptions.add(
            combineLatest( [ this.facade.event$, this.facade.eventOptionsMetadata$ ] ).pipe(
                filter( ([ , options ]: [ EventModel | undefined, EventOptionModel[] ]): boolean =>
                    !ArrayUtil.isNullOrEmpty( options ),
                ),
                map( ([ event, options ]: [ EventModel | undefined, EventOptionModel[] ]): void => {
                    this.addOptionsFieldIfNeeded( options )
                    this.fillForm( event )
                } ),
            ).subscribe(),
        )
    }

    private addOptionsFieldIfNeeded (options: EventOptionModel[]): void {
        options.forEach( (option: EventOptionModel): void => {
            if (this.optionsForm.get( option.value )) return
            this.optionsForm.addControl( option.value, this.formBuilder.control( false ) )
        } )
        this.optionsForm.addValidators( RegistryValidators.preRequiredOptions( options ) )
    }

    private handleOptionsChange (): void {
        this.subscriptions.add(
            this.optionsForm.valueChanges.pipe(
                tap( (options: object): void => {
                    const selectableOptions: boolean[] = Object.values( options )
                    const selectedOptions: number = selectableOptions.filter( (active: boolean): boolean => active ).length
                    this.allSelected = selectedOptions === 0 ? false : selectedOptions === selectableOptions.length ? true : undefined
                } ),
            ).subscribe(),
        )
    }

    protected fillForm (element: EventModel | undefined): void {
        if (!element) return

        this.name.patchValue( element.name )
        this.beginDateTime.patchValue( element.begin )
        this.endDateTime.patchValue( element.end )
        element.options.forEach( (option: SelectItem<string>): void =>
            this.getOptionControl( option.value ).patchValue( true ),
        )
    }

    protected submit (): void {
        if (!FormUtil.isFormValid( this.form ) || !FormUtil.isFormValid( this.optionsForm )) {
            console.warn( this.invalidFormMessage, {
                ...this.form.value,
                ...this.optionsForm.value,
            } )
            return
        }

        const dto: EventDto = this.buildDto()
        const observable: Observable<CreateEvent | UpdateEvent> =
            this.facade.event()
            ? this.facade.updateEvent( this.facade.event()!.id!, dto )
            : this.facade.createEvent( dto )

        this.subscriptions.add(
            observable.pipe(
                map( (): void => this.navigateToRedirectUri( this.nextNavigation ) ),
            ).subscribe(),
        )
    }

    protected buildDto (): EventDto {
        const optionIds: string[] = Object
            .keys( this.optionsForm.controls )
            .filter( (key: string): boolean => this.getOptionControl( key as string ).value )
            .map( (key: string): string => key as string )

        return {
            name: this.name.value,
            begin: this.beginDateTime.value,
            end: this.endDateTime.value,
            options: optionIds,
        }
    }

    protected selectAll (event: CheckboxChangeEvent): void {
        this.facade.eventOptionsMetadata()?.forEach( (option: SelectItem<string>): void => {
            this.getOptionControl( option.value ).patchValue( event.checked )
        } )
    }

    protected get idParam (): string | undefined {
        return this.route.snapshot.params['eventId']
    }

    protected get name (): FormControl {
        return this.form.get( 'name' ) as FormControl
    }

    protected get beginDateTime (): FormControl {
        return this.form.get( 'beginDateTime' ) as FormControl
    }

    protected get endDateTime (): FormControl {
        return this.form.get( 'endDateTime' ) as FormControl
    }

    protected getOptionControl (option: string): FormControl {
        return this.optionsForm.get( option ) as FormControl
    }
}
