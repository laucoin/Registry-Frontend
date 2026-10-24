import { inject, Injectable, Signal } from '@angular/core'
import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { AlertModel } from '@shared/models/model/alert.model'
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'

/**
 * Purpose: Point d'entrée public du domaine du projet sélectionné pour les pages, composants et guards.
 * Scope: Expose le store du projet sélectionné sous forme de signals, relaie ses requêtes et exécute les commandes du projet sélectionné avec leurs notifications.
 * Limits: Ne détient aucun état propre et ne construit aucune requête HTTP lui-même.
 */
@Injectable()
export class SelectedProjectFacade extends GenericFacade {
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )
    private readonly store: InstanceType<typeof SelectedProjectStore> = inject( SelectedProjectStore )

    public readonly participantsStatus: Signal<ProjectStatusModel | undefined> = this.store.status.participants.element

    public readonly vehiclesStatus: Signal<VehicleStatusModel | undefined> = this.store.status.vehicles.element

    public readonly participantsBirthdays: Signal<ParticipantModel[] | undefined> = this.store.birthdays.element

    public readonly participantsBirthdaysLoading: Signal<boolean> = this.store.birthdays.loading

    public readonly participantsBirthdaysError: Signal<NotificationModel | undefined> = this.store.birthdays.error

    public readonly currentMovementsPageWithoutActivityLoading: Signal<boolean> = this.store.isCurrent.withoutActivity.loading

    public readonly currentMovementsPageWithoutActivitySilentLoading: Signal<boolean> = this.store.isCurrent.withoutActivity.silentLoading

    public readonly currentMovementsPageWithoutActivityError: Signal<NotificationModel | undefined> = this.store.isCurrent.withoutActivity.error

    public readonly currentMovementsPageWithoutActivity: Signal<PageModel<MovementModel> | undefined> = this.store.isCurrent.withoutActivity.element

    public readonly currentMovementsPageWithActivityLoading: Signal<boolean> = this.store.isCurrent.withActivity.loading

    public readonly currentMovementsPageWithActivitySilentLoading: Signal<boolean> = this.store.isCurrent.withActivity.silentLoading

    public readonly currentMovementsPageWithActivityError: Signal<NotificationModel | undefined> = this.store.isCurrent.withActivity.error

    public readonly currentMovementsPageWithActivity: Signal<PageModel<MovementModel> | undefined> = this.store.isCurrent.withActivity.element

    public readonly plannedArrivals: Signal<PlannedMovementModel[] | undefined> = this.store.arrivals.element

    public readonly plannedArrivalsLoading: Signal<boolean> = this.store.arrivals.loading

    public readonly plannedArrivalsError: Signal<NotificationModel | undefined> = this.store.arrivals.error

    public readonly plannedDepartures: Signal<PlannedMovementModel[] | undefined> = this.store.departures.element

    public readonly plannedDeparturesLoading: Signal<boolean> = this.store.departures.loading

    public readonly plannedDeparturesError: Signal<NotificationModel | undefined> = this.store.departures.error

    public readonly overdueParticipantsPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.overdue.element

    public readonly overdueParticipantsPageLoading: Signal<boolean> = this.store.overdue.loading

    public readonly overdueParticipantsPageError: Signal<NotificationModel | undefined> = this.store.overdue.error

    public readonly overdueParticipantsListPage: Signal<PageModel<ParticipantModel> | undefined> = this.store.overdueList.element

    public readonly overdueParticipantsListLoading: Signal<boolean> = this.store.overdueList.loading

    public readonly overdueParticipantsListSilentLoading: Signal<boolean> = this.store.overdueList.silentLoading

    public readonly overdueParticipantsListError: Signal<NotificationModel | undefined> = this.store.overdueList.error

    public readonly currentAlertsPageLoading: Signal<boolean> = this.store.alerts.loading

    public readonly currentAlertsPageError: Signal<NotificationModel | undefined> = this.store.alerts.error

    public readonly currentAlertsPage: Signal<PageModel<AlertModel> | undefined> = this.store.alerts.element

    public fetchOverdueParticipantsPage (page: number | undefined, size: number | undefined): void {
        this.store.fetchOverduePage( { projectId: this.selectedProjectId(), page: page, size: size } )
    }

    public fetchOverdueParticipantsListPage (page: number | undefined, size: number | undefined): void {
        this.store.fetchOverdueListPage( { projectId: this.selectedProjectId(), page: page, size: size } )
    }

    public fetchPlannedArrivals (): void {
        this.store.fetchPlannedArrivals( this.selectedProjectId() )
    }

    public fetchPlannedDepartures (): void {
        this.store.fetchPlannedDepartures( this.selectedProjectId() )
    }

    public fetchParticipantsStatus (): void {
        this.store.fetchParticipantsStatus( this.selectedProjectId() )
    }

    public fetchParticipantsBirthdays (): void {
        this.store.fetchParticipantsBirthdays( this.selectedProjectId() )
    }

    public fetchVehiclesStatus (): void {
        this.store.fetchVehiclesStatus( this.selectedProjectId() )
    }

    public fetchCurrentMovementsPageWithoutActivity (page: number | undefined, size: number | undefined): void {
        this.store.fetchCurrentMovementsPageWithoutActivity( {
            projectId: this.selectedProjectId(),
            page: page,
            size: size,
        } )
    }

    public fetchCurrentMovementsPageWithActivity (page: number | undefined, size: number | undefined): void {
        this.store.fetchCurrentMovementsPageWithActivity( {
            projectId: this.selectedProjectId(),
            page: page,
            size: size,
        } )
    }

    public fetchCurrentAlertsPage (page: number | undefined, size: number | undefined): void {
        this.store.fetchCurrentAlertsPage( { projectId: this.selectedProjectId(), page: page, size: size } )
    }

    public refreshParticipantsStatus (): void {
        this.store.refreshParticipantsStatus( this.selectedProjectId() )
    }

    public refreshVehiclesStatus (): void {
        this.store.refreshVehiclesStatus( this.selectedProjectId() )
    }

    public refreshPlannedArrivals (): void {
        this.store.refreshPlannedArrivals( this.selectedProjectId() )
    }

    public refreshPlannedDepartures (): void {
        this.store.refreshPlannedDepartures( this.selectedProjectId() )
    }

    public refreshParticipantsBirthdays (): void {
        this.store.refreshParticipantsBirthdays( this.selectedProjectId() )
    }

    public refreshOverdueParticipantsPage (): void {
        this.store.refreshOverduePage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.overdueParticipantsPage() ) } )
    }

    public refreshCurrentAlertsPage (): void {
        this.store.refreshCurrentAlertsPage( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.currentAlertsPage() ) } )
    }

    public refreshCurrentMovementsPageWithoutActivity (): void {
        this.store.refreshCurrentMovementsPageWithoutActivity( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.currentMovementsPageWithoutActivity() ) } )
    }

    public refreshCurrentMovementsPageWithActivity (): void {
        this.store.refreshCurrentMovementsPageWithActivity( { projectId: this.selectedProjectId(), ...CumulativePageHelper.reloadRequest( this.currentMovementsPageWithActivity() ) } )
    }

    private get selectedProjectId (): Signal<string | undefined> {
        return this.sessionFacade.currentProjectId
    }
}
