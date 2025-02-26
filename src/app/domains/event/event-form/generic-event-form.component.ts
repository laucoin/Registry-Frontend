import { Component, signal, Signal } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { EventFacade } from '../data/state/event.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { AppConfig } from '../../../app.config'
import { EventOptionModel } from '../data/model/event-option.model'
import { Observable } from 'rxjs'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { DateUtil } from '../../../shared/util-tool/util/date.util'

@Component( {
    template: '',
} )
export abstract class GenericEventFormComponent extends GenericFormComponent {
    protected readonly optionsForm: FormGroup = this.formBuilder.group( {} )

    protected readonly startDateExample: Signal<Date> = signal( DateUtil.startDateExample )
    protected readonly endDateExample: Signal<Date> = signal( DateUtil.endDateExample )

    protected eventOptions$: Observable<EventOptionModel[]>

    public constructor (protected readonly facade: EventFacade) {
        super(
            AppRouteEnum.EVENTS,
            facade.eventLoading,
        )

        this.eventOptions$ = facade.eventOptionsMetadata

        facade.fetchEventOptions()
        facade.resetEvent()

        this.handleEventOptions()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            name: this.formBuilder.control(
                undefined,
                [ Validators.required, CustomValidators.nonBlank(), Validators.maxLength( 150 ) ],
            ),
            range: this.formBuilder.control( [] ),
        } )
    }

    protected override isFormValid (): boolean {
        FormUtil.markAllControlsAsDirty( this.form )
        FormUtil.markAllControlsAsDirty( this.optionsForm )
        return !this.form.invalid && !this.optionsForm.invalid
    }

    private handleEventOptions (): void {
        this.subscriptions.add(
            this.eventOptions$.subscribe( (options: EventOptionModel[]): void => {
                if (!options || options.length === 0) return
                options.forEach( (option: EventOptionModel): void => {
                    this.optionsForm.addControl( option.value, this.formBuilder.control( false ) )
                } )
                this.optionsForm.addValidators( CustomValidators.preRequiredOptions( options ) )
            } ),
        )
    }

    protected buildOptions (): string[] {
        return Object.keys( this.optionsForm.controls )
                     .filter( (key: string): boolean => this.getOptionControl( key as string ).value )
                     .map( (key: string): string => key as string )
    }

    protected optionIcon (option: string): string {
        return AppConfig.config.event.optionIcons.get( option ) ?? ''
    }

    protected get name (): FormControl {
        return this.form.get( 'name' ) as FormControl
    }

    protected get range (): FormControl {
        return this.form.get( 'range' ) as FormControl
    }

    protected getOptionControl (option: string): FormControl {
        return this.optionsForm.get( option ) as FormControl
    }
}
