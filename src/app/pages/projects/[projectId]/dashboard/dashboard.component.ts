import { Component, computed, inject, OnDestroy, Signal } from '@angular/core'
import { Card } from 'primeng/card'
import { Divider } from 'primeng/divider'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { Skeleton } from 'primeng/skeleton'
import { TranslatePipe } from '@ngx-translate/core'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { Panel } from 'primeng/panel'
import { ElementCardComponent } from '@shared/ui/element-card/element-card.component'
import { SeverityCircleComponent } from '@shared/ui/severity-circle/severity-circle.component'
import { SeverityTagComponent } from '@shared/ui/severity-tag/severity-tag.component'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import {
    SeverityInformationComponent,
} from '@shared/ui/severity-information/severity-information.component'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { Subscription, tap } from 'rxjs'

@Component( {
    selector: 'app-dashboard',
    imports: [
        Card,
        Divider,
        PluralTranslationPipe,
        Skeleton,
        TranslatePipe,
        Panel,
        ElementCardComponent,
        SeverityCircleComponent,
        SeverityTagComponent,
        TitleCasePipe,
        UpperCasePipe,
        DateFormatPipe,
        SeverityInformationComponent,
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
} )
export class DashboardComponent extends GenericComponent implements OnDestroy {
    protected readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    protected readonly movementFacade: MovementFacade = inject( MovementFacade )

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly ParticipantTypeEnum: typeof ParticipantTypeEnum = ParticipantTypeEnum
    protected readonly PresenceStatusEnum: typeof PresenceStatusEnum = PresenceStatusEnum

    protected readonly totalParticipants: Signal<number | undefined>
    protected readonly totalGuests: Signal<number | undefined>
    protected readonly totalPresentRegistered: Signal<number | undefined>
    protected readonly totalAbsentRegistered: Signal<number | undefined>
    protected readonly totalVehicles: Signal<number | undefined>
    protected readonly totalPresentVehicles: Signal<number | undefined>
    protected readonly totalAbsentVehicles: Signal<number | undefined>

    public constructor () {
        super()

        this.facade.loadProjectHomeInformation()

        this.totalParticipants = computed( (): number | undefined => {
            if (GenericHelper.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.guests
                   + this.facade.participantsStatus()!.registered.presentMajors
                   + this.facade.participantsStatus()!.registered.presentMinors
                   + this.facade.participantsStatus()!.registered.absentMajors
                   + this.facade.participantsStatus()!.registered.absentMinors
        } )

        this.totalGuests = computed( (): number | undefined => {
            if (GenericHelper.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.guests
        } )

        this.totalPresentRegistered = computed( (): number | undefined => {
            if (GenericHelper.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.registered.presentMajors
                   + this.facade.participantsStatus()!.registered.presentMinors
        } )

        this.totalAbsentRegistered = computed( (): number | undefined => {
            if (GenericHelper.isNull( this.facade.participantsStatus() )) return undefined
            return this.facade.participantsStatus()!.registered.absentMajors
                   + this.facade.participantsStatus()!.registered.absentMinors
        } )

        this.totalVehicles = computed( (): number | undefined => {
            if (GenericHelper.isNull( this.facade.vehiclesStatus() )) return undefined
            return this.facade.vehiclesStatus()!.present
                   + this.facade.vehiclesStatus()!.absent
        } )

        this.totalPresentVehicles = computed( (): number | undefined => {
            if (GenericHelper.isNull( this.facade.vehiclesStatus() )) return undefined
            return this.facade.vehiclesStatus()!.present
        } )

        this.totalAbsentVehicles = computed( (): number | undefined => {
            if (GenericHelper.isNull( this.facade.vehiclesStatus() )) return undefined
            return this.facade.vehiclesStatus()!.absent
        } )

        this.handleMovementActions()
    }

    public ngOnDestroy (): void {
        this.subscriptions.unsubscribe()
    }

    private handleMovementActions (): void {
        this.subscriptions.add(
            this.movementFacade.handleMovementChanges().pipe(
                tap( (): void => this.facade.loadProjectHomeInformation() ),
            ).subscribe(),
        )
    }
}
