import { FormControl, FormGroup } from '@angular/forms'
import { GenericComponent } from './generic.component'
import { AppRouteEnum } from '../../../app-route.enum'
import { Subscription } from 'rxjs'
import { EventModel } from '../../util-model/model/event.model'
import { RegistryValidators } from '../util/registry.validator'
import { inject, Signal } from '@angular/core'
import { FormUtil } from '../util/form.util'
import { toSignal } from '@angular/core/rxjs-interop'
import { CustomDateFormatPipe } from '../pipe/custom-date-format.pipe'

export abstract class GenericFormComponent<M, D> extends GenericComponent {
    protected readonly FormUtil: typeof FormUtil = FormUtil

    private readonly datePipe: CustomDateFormatPipe = inject( CustomDateFormatPipe )

    protected readonly subscriptions: Subscription = new Subscription()

    protected readonly invalidFormMessage: string = this.translateService.instant( 'global.messages.invalid-form' )
    protected readonly startDateExample: Date = GenericFormComponent.startDateExample
    protected readonly endDateExample: Date = GenericFormComponent.endDateExample

    protected readonly contextEvent: Signal<EventModel | undefined>

    protected constructor () {
        super()

        this.contextEvent = toSignal( this.registryFacade.contextEvent$ )
    }

    private static get startDateExample (): Date {
        const now: Date = new Date()

        if (now.getMonth() > 6) {
            now.setFullYear( now.getFullYear() + 1 )
        }

        now.setMonth( 6, 20 )
        now.setHours(
            Math.floor( Math.random() * 23 ),
            Math.floor( Math.random() * 59 ),
        )
        return now
    }

    private static get endDateExample (): Date {
        const now: Date = this.startDateExample
        now.setMonth( 7, 2 )
        now.setHours(
            Math.floor( Math.random() * 23 ),
            Math.floor( Math.random() * 59 ),
        )
        return now
    }

    protected loadData (): void {
        const eventId: string | undefined = this.contextEventId()
        if (!eventId) {
            this.router.navigateByUrl( AppRouteEnum.HOME ).catch( console.error )
        }
        this.registryFacade.fetchContextEvent( eventId!, false )
    }

    protected abstract initForm (): FormGroup

    protected abstract handleLoadedElement (): void

    protected addEventDateValidators (
        event: EventModel | undefined,
        control: FormControl,
    ): void {
        if (event?.begin) {
            control.addValidators( RegistryValidators.minDateTime(
                event?.begin,
                this.datePipe.transform( event?.begin ),
            ) )
        }
        if (event?.end) {
            control.addValidators( RegistryValidators.maxDateTime(
                event?.end,
                this.datePipe.transform( event?.end ),
            ) )
        }
    }

    protected abstract fillForm (element: M | undefined): void

    protected abstract submit (): void

    protected abstract buildDto (): D

    protected navigateToRedirectUri (route: AppRouteEnum): void {
        this.router.navigateByUrl( this.buildUri( route ) ).catch( console.error )
    }

    protected abstract get idParam (): string | undefined
}
