import { Component, computed, inject, OnDestroy, Signal } from '@angular/core'
import { Card } from 'primeng/card'
import { Divider } from 'primeng/divider'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { Skeleton } from 'primeng/skeleton'
import {TranslocoPipe} from '@jsverse/transloco'
import { GenericComponent } from '@shared/ui/base/generic.component'
import { GenericHelper } from '@shared/helpers/generic.helper'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { Panel } from 'primeng/panel'
import { ElementCardComponent } from '@shared/ui/common/element-card/element-card.component'
import { SeverityCircleComponent } from '@shared/ui/common/severity-circle/severity-circle.component'
import { SeverityTagComponent } from '@shared/ui/common/severity-tag/severity-tag.component'
import { TitleCasePipe, UpperCasePipe } from '@angular/common'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'
import {
    SeverityInformationComponent,
} from '@shared/ui/common/severity-information/severity-information.component'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { Subscription, tap } from 'rxjs'

/**
 * Purpose: Dashboard of the selected project.
 * Scope: Lays out the status, birthdays, current movements and current alerts widgets.
 * Limits: Each widget loads its own data; it does not fetch anything itself.
 */
@Component( {
    selector: 'app-dashboard',
    imports: [
        Card,
        Divider,
        PluralTranslationPipe,
        Skeleton,
        TranslocoPipe,
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
    styleUrl: './dashboard.component.css',
} )
export class DashboardComponent extends GenericComponent implements OnDestroy {
    protected readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    protected readonly movementFacade: MovementFacade = inject( MovementFacade )

    private readonly subscriptions: Subscription = new Subscription()

    protected readonly ParticipantTypeEnum: typeof ParticipantTypeEnum = ParticipantTypeEnum
    protected readonly PresenceStatusEnum: typeof PresenceStatusEnum = PresenceStatusEnum

    protected readonly totalParticipants: Signal<number | undefined> = this.participantsTotal(
        (status: ProjectStatusModel): number => status.guests + this.registeredTotal( status ),
    )
    protected readonly totalGuests: Signal<number | undefined> = this.participantsTotal( (status: ProjectStatusModel): number => status.guests )
    protected readonly totalPresentRegistered: Signal<number | undefined> = this.participantsTotal(
        (status: ProjectStatusModel): number => status.registered.presentMajors + status.registered.presentMinors,
    )
    protected readonly totalAbsentRegistered: Signal<number | undefined> = this.participantsTotal(
        (status: ProjectStatusModel): number => status.registered.absentMajors + status.registered.absentMinors,
    )
    protected readonly totalVehicles: Signal<number | undefined> = this.vehiclesTotal( (status: VehicleStatusModel): number => status.present + status.absent )
    protected readonly totalPresentVehicles: Signal<number | undefined> = this.vehiclesTotal( (status: VehicleStatusModel): number => status.present )
    protected readonly totalAbsentVehicles: Signal<number | undefined> = this.vehiclesTotal( (status: VehicleStatusModel): number => status.absent )

    public constructor () {
        super()

        this.facade.loadProjectHomeInformation()
        this.handleMovementActions()
    }

    private participantsTotal (total: (status: ProjectStatusModel) => number): Signal<number | undefined> {
        return computed( (): number | undefined => {
            const status: ProjectStatusModel | undefined = this.facade.participantsStatus()
            return GenericHelper.isNull( status ) ? undefined : total( status! )
        } )
    }

    private vehiclesTotal (total: (status: VehicleStatusModel) => number): Signal<number | undefined> {
        return computed( (): number | undefined => {
            const status: VehicleStatusModel | undefined = this.facade.vehiclesStatus()
            return GenericHelper.isNull( status ) ? undefined : total( status! )
        } )
    }

    private registeredTotal (status: ProjectStatusModel): number {
        return status.registered.presentMajors + status.registered.presentMinors + status.registered.absentMajors + status.registered.absentMinors
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
