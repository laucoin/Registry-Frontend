import { Component, OnInit } from '@angular/core'
import { GenericEventFormComponent } from '../generic-event-form.component'
import { EventDto } from '../../data/dto/event.dto'
import { TranslateModule } from '@ngx-translate/core'
import { ReactiveFormsModule } from '@angular/forms'
import { FormFieldErrorComponent } from '../../../../shared/util-ui/form-field-error/form-field-error.component'
import { CalendarModule } from 'primeng/calendar'
import { AsyncPipe, DatePipe } from '@angular/common'
import { InputTextModule } from 'primeng/inputtext'
import { DividerModule } from 'primeng/divider'
import { InputSwitchModule } from 'primeng/inputswitch'
import { Params } from '@angular/router'
import { AppRouteEnum } from '../../../../app-route.enum'
import { EventModel } from '../../../../shared/util-model/model/event.model'
import { ProgressSpinnerModule } from 'primeng/progressspinner'
import { FormUtil } from '../../../../shared/util-tool/util/form.util'
import { EventOptionEnum } from '../../../../shared/util-model/enumeration/event-option.enum'
import { Observable } from 'rxjs'
import { CardModule } from 'primeng/card'
import { FormComponent } from '../../../../shared/util-ui/form/form.component'
import { GenericUtil } from '../../../../shared/util-tool/util/generic.util'

@Component( {
    selector: 'app-event-edition-form',
    standalone: true,
    imports: [
        TranslateModule,
        ReactiveFormsModule,
        FormFieldErrorComponent,
        CalendarModule,
        DatePipe,
        InputTextModule,
        DividerModule,
        InputSwitchModule,
        AsyncPipe,
        ProgressSpinnerModule,
        CardModule,
        FormComponent,
    ],
    templateUrl: './event-edition-form.component.html',
    styleUrl: './event-edition-form.component.scss',
} )
export class EventEditionFormComponent extends GenericEventFormComponent implements OnInit {
    protected readonly event$: Observable<EventModel | undefined> = this.facade.element

    public ngOnInit (): void {
        this.facade.resetElement()

        this.handleIdParam()

        this.handleLoadedEvent()
    }

    private handleIdParam (): void {
        this.subscriptions.add(
            this.route.params.subscribe( (params: Params): void => {
                if (GenericUtil.isNull( params['id'] )) {
                    this.router.navigateByUrl( AppRouteEnum.EVENTS_CREATION ).catch( console.error )
                }
                this.facade.fetchElement( params['id'] )
            } ),
        )
    }

    private handleLoadedEvent (): void {
        this.subscriptions.add(
            this.event$.subscribe( (event: EventModel | undefined): void => {
                if (!event) return
                this.name.setValue( event?.name )
                this.range.setValue( FormUtil.buildDateRange( event?.begin, event?.end ) )
                this.ticketing.setValue( event?.options.includes( EventOptionEnum.TICKETING ) )
                this.vehicle.setValue( event?.options.includes( EventOptionEnum.VEHICLE ) )
                this.activity.setValue( event?.options.includes( EventOptionEnum.ACTIVITY ) )
                this.phoneCommunication.setValue( event?.options.includes( EventOptionEnum.PHONE_COMMUNICATION ) )
                this.activityCommunication.setValue( event?.options.includes( EventOptionEnum.ACTIVITY_COMMUNICATION ) )
                this.fireRisk.setValue( event?.options.includes( EventOptionEnum.FIRE_RISK ) )
                this.smokeReporting.setValue( event?.options.includes( EventOptionEnum.SMOKE_REPORT ) )
                this.movementReporting.setValue( event?.options.includes( EventOptionEnum.MOVEMENT_REPORT ) )
                FormUtil.markAllControlsAsDirty( this.form )
            } ),
        )
    }

    protected next (): void {
        const event: EventDto = {
            name: this.name.value,
            begin: this.range.value?.[0],
            end: this.range.value?.[1],
            options: this.buildOptions(),
        }

        this.subscriptions.add(
            this.facade.updateElement( this.route.snapshot.params['id'], event )
                .subscribe( (): void => this.navigateToRedirectUri() ),
        )
    }
}
