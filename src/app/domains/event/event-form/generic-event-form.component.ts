import { inject } from '@angular/core'
import { EventFacade } from '../data/state/event.facade'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { RegistryValidators } from '../../../shared/util-tool/util/registry.validator'
import { EventOptionModel } from '../data/model/event-option.model'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { EventModel } from '../../../shared/util-model/model/event.model'
import { EventDto } from '../data/dto/event.dto'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { combineLatest, filter, map, Observable } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { CreateEvent, UpdateEvent } from '../data/state/event.action'
import { ArrayUtil } from '../../../shared/util-tool/util/array.util'

export abstract class GenericEventFormComponent extends GenericFormComponent<EventModel, EventDto> {
    protected readonly facade: EventFacade = inject( EventFacade )

    protected readonly form: FormGroup = this.formBuilder.group( {} )
    protected readonly optionsForm: FormGroup = this.formBuilder.group( {} )
    protected readonly nextNavigation: AppRouteEnum = AppRouteEnum.EVENTS

    public constructor () {
        super()

        this.form = this.initForm()

        this.loadData()

        this.handleLoadedElement()
    }

    protected override loadData (): void {
        this.facade.resetEvent()
        this.facade.fetchEventOptions()
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
                    this.addOptionsFieldIfNecessary( options )
                    this.fillForm( event )
                } ),
            ).subscribe(),
        )
    }

    private addOptionsFieldIfNecessary (options: EventOptionModel[]): void {
        options.forEach( (option: EventOptionModel): void => {
            if (this.optionsForm.get( option.value )) return
            this.optionsForm.addControl( option.value, this.formBuilder.control( false ) )
        } )
        this.optionsForm.addValidators( RegistryValidators.preRequiredOptions( options ) )
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
