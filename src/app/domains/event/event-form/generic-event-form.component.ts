import { Component } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { EventFacade } from '../data/state/event.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { AppConfig } from '../../../app.config'
import { EventOptionModel } from '../data/model/event-option.model'
import { Observable } from 'rxjs'
import { FormUtil } from '../../../shared/util-tool/util/form.util'
import { SelectItem } from 'primeng/api'

@Component( {
    template: '',
} )
export abstract class GenericEventFormComponent extends GenericFormComponent {
    protected readonly optionsForm: FormGroup = this.formBuilder.group( {} )

    protected eventOptions$: Observable<EventOptionModel[]>

    public constructor (protected readonly facade: EventFacade) {
        super(
            AppRouteEnum.EVENTS,
            facade.elementLoading,
        )

        this.eventOptions$ = facade.eventOptions

        facade.fetchEventOptions()
        facade.resetElement()

        this.handleEventOptions()
    }

    protected initForm (): FormGroup {
        return this.formBuilder.group( {
            name: this.formBuilder.control( undefined, [ Validators.required, CustomValidators.nonBlank() ] ),
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
                    options.forEach( (option: EventOptionModel): void => this.optionsForm.addControl(
                        option.value,
                        this.formBuilder.control( false ),
                    ) )
                    options.forEach( (option: EventOptionModel): void => {
                        if (option.preRequired.length > 0) {
                            this.getOptionControl( option.value ).disable()
                        }
                    } )
                    this.handleOptionsFormValueChanges( options.filter( (option: EventOptionModel): boolean => option.preRequired.length > 0 ) )
                },
            ),
        )
    }

    private handleOptionsFormValueChanges (options: EventOptionModel[]): void {
        this.optionsForm.valueChanges.subscribe( (): void =>
            options.forEach( (option: EventOptionModel): void => {
                const missing: SelectItem<string>[] = option.preRequired.filter(
                    (preRequired: SelectItem<string>): boolean => !this.getOptionControl( preRequired.value ).value,
                )
                if (missing.length > 0) {
                    this.getOptionControl( option.value ).setValue( false, { emitEvent: false } )
                    this.getOptionControl( option.value ).disable( { emitEvent: false } )
                } else {
                    this.getOptionControl( option.value ).enable( { emitEvent: false } )
                }
            } ),
        )
    }

    protected buildOptions (): string[] {
        return Object.keys( this.optionsForm.controls )
                     .filter( (key: string): boolean => this.getOptionControl( key as string ).value )
                     .map( (key: string): string => key as string )
    }

    protected get exampleBeginDate (): Date {
        const now: Date = new Date()

        if (now.getMonth() > 6) {
            now.setFullYear( now.getFullYear() + 1 )
        }

        now.setMonth( 6, 20 )
        return now
    }

    protected get exampleEndDate (): Date {
        const now: Date = this.exampleBeginDate
        now.setMonth( 7, 2 )
        return now
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
