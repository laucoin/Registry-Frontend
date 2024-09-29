import { Component } from '@angular/core'
import { GenericFormComponent } from '../../../shared/util-tool/component/generic-form.component'
import { EventFacade } from '../data/state/event.facade'
import { AppRouteEnum } from '../../../app-route.enum'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { CustomValidators } from '../../../shared/util-tool/util/custom-validator'
import { EventOptionEnum } from '../../../shared/util-model/enumeration/event-option.enum'
import { combineLatest } from 'rxjs'
import { AppConfig } from '../../../app.config'

@Component( {
    template: '',
} )
export abstract class GenericEventFormComponent extends GenericFormComponent {
    protected readonly EventOptionEnum: typeof EventOptionEnum = EventOptionEnum

    public constructor (protected readonly facade: EventFacade) {
        super(
            AppRouteEnum.EVENTS,
            facade.elementLoading,
            facade.elementError,
        )

        facade.resetElement()
        this.handleActivityFormValueChanges()
        this.handleActivityAndCommunicationFormValueChanges()
    }

    protected initForm (): FormGroup {
        const group: FormGroup = this.formBuilder.group( {
            name: this.formBuilder.control( undefined, [ Validators.required, CustomValidators.nonBlank() ] ),
            range: this.formBuilder.control( [] ),
            ticketing: this.formBuilder.control( false ),
            vehicle: this.formBuilder.control( false ),
            activity: this.formBuilder.control( false ),
            phoneCommunication: this.formBuilder.control( false ),
            activityCommunication: this.formBuilder.control( false ),
            fireRisk: this.formBuilder.control( false ),
            smokeReporting: this.formBuilder.control( false ),
            movementReporting: this.formBuilder.control( false ),
        } )

        group.get( 'activityCommunication' )?.disable()
        group.get( 'smokeReporting' )?.disable()
        group.get( 'movementReporting' )?.disable()

        return group
    }

    private handleActivityFormValueChanges (): void {
        this.subscriptions.add(
            this.activity.valueChanges.subscribe( (activity: boolean): void => {
                    if (!activity) {
                        this.activityCommunication.setValue( false )
                        this.activityCommunication.disable()
                    } else {
                        this.activityCommunication.enable()
                    }
                },
            ),
        )
    }

    private handleActivityAndCommunicationFormValueChanges (): void {
        this.subscriptions.add(
            combineLatest( [ this.activity.valueChanges, this.activityCommunication.valueChanges ] )
                .subscribe( ([ activity, communication ]: [ boolean, boolean ]): void => {
                        if (activity && communication) {
                            this.smokeReporting.enable()
                            this.movementReporting.enable()
                        } else {
                            this.smokeReporting.setValue( false )
                            this.smokeReporting.disable()
                            this.movementReporting.setValue( false )
                            this.movementReporting.disable()
                        }
                    },
                ),
        )
    }

    protected buildOptions (): EventOptionEnum[] {
        return [
            ...this.activity.value ? [ EventOptionEnum.ACTIVITY ] : [],
            ...this.phoneCommunication.value ? [ EventOptionEnum.PHONE_COMMUNICATION ] : [],
            ...this.activityCommunication.value ? [ EventOptionEnum.ACTIVITY_COMMUNICATION ] : [],
            ...this.smokeReporting.value ? [ EventOptionEnum.SMOKE_REPORT ] : [],
            ...this.movementReporting.value ? [ EventOptionEnum.MOVEMENT_REPORT ] : [],
            ...this.ticketing.value ? [ EventOptionEnum.TICKETING ] : [],
            ...this.vehicle.value ? [ EventOptionEnum.VEHICLE ] : [],
            ...this.fireRisk.value ? [ EventOptionEnum.FIRE_RISK ] : [],
        ]
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

    protected optionIcon (option: EventOptionEnum): string {
        return AppConfig.config.event.optionIcons.get( option ) ?? ''
    }

    protected get name (): FormControl {
        return this.form.get( 'name' ) as FormControl
    }

    protected get range (): FormControl {
        return this.form.get( 'range' ) as FormControl
    }

    protected get activity (): FormControl {
        return this.form.get( 'activity' ) as FormControl
    }

    protected get phoneCommunication (): FormControl {
        return this.form.get( 'phoneCommunication' ) as FormControl
    }

    protected get activityCommunication (): FormControl {
        return this.form.get( 'activityCommunication' ) as FormControl
    }

    protected get movementReporting (): FormControl {
        return this.form.get( 'movementReporting' ) as FormControl
    }

    protected get smokeReporting (): FormControl {
        return this.form.get( 'smokeReporting' ) as FormControl
    }

    protected get ticketing (): FormControl {
        return this.form.get( 'ticketing' ) as FormControl
    }

    protected get vehicle (): FormControl {
        return this.form.get( 'vehicle' ) as FormControl
    }

    protected get fireRisk (): FormControl {
        return this.form.get( 'fireRisk' ) as FormControl
    }
}
