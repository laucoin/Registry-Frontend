import { computed, inject, Injectable, Signal } from '@angular/core'
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { ToastMessageOptions } from 'primeng/api'
import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ProjectHelper } from '@shared/helpers/project.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { AlertModel } from '@shared/models/model/alert.model'

/**
 * Purpose: Public entry point of the selected project domain for pages, components and guards.
 * Scope: Exposes the selected project store as signals, forwards its queries and runs the selected project commands with their notifications.
 * Limits: Holds no state of its own and builds no HTTP request itself.
 */
@Injectable()
export class SelectedProjectFacade extends GenericFacade {
    private readonly sessionFacade: SessionFacade = inject( SessionFacade )
    private readonly store: InstanceType<typeof SelectedProjectStore> = inject( SelectedProjectStore )

    public readonly participantsStatus: Signal<ProjectStatusModel | undefined> = this.store.status.participants.element

    public readonly participantsStatusLoading: Signal<boolean> = this.store.status.participants.loading

    public readonly participantsStatusError: Signal<ToastMessageOptions | undefined> = this.store.status.participants.error

    public readonly vehiclesStatus: Signal<VehicleStatusModel | undefined> = this.store.status.vehicles.element

    public readonly vehiclesStatusLoading: Signal<boolean> = this.store.status.vehicles.loading

    public readonly vehiclesStatusError: Signal<ToastMessageOptions | undefined> = this.store.status.vehicles.error

    public readonly participantsBirthdays: Signal<ParticipantModel[]> = this.store.birthdays

    public readonly currentMovementsPageWithoutActivityLoading: Signal<boolean> = this.store.currentMovements.withoutActivity.loading

    public readonly currentMovementsPageWithoutActivitySilentLoading: Signal<boolean> = this.store.currentMovements.withoutActivity.silentLoading

    public readonly currentMovementsPageWithoutActivityError: Signal<ToastMessageOptions | undefined> = this.store.currentMovements.withoutActivity.error

    public readonly currentMovementsPageWithoutActivity: Signal<PageModel<MovementModel> | undefined> = this.store.currentMovements.withoutActivity.element

    public readonly currentMovementsPageWithoutActivityStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.currentMovements.withoutActivity.params.startDateTimeSearched() ),
        )

    public readonly currentMovementsPageWithoutActivityEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.currentMovements.withoutActivity.params.endDateTimeSearched() ),
        )

    public readonly currentMovementsPageWithActivityLoading: Signal<boolean> = this.store.currentMovements.withActivity.loading

    public readonly currentMovementsPageWithActivitySilentLoading: Signal<boolean> = this.store.currentMovements.withActivity.silentLoading

    public readonly currentMovementsPageWithActivityError: Signal<ToastMessageOptions | undefined> = this.store.currentMovements.withActivity.error

    public readonly currentMovementsPageWithActivity: Signal<PageModel<MovementModel> | undefined> = this.store.currentMovements.withActivity.element

    public readonly currentMovementsPageWithActivityStartDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.currentMovements.withActivity.params.startDateTimeSearched() ),
        )

    public readonly currentMovementsPageWithActivityEndDateTimeSearchedParam: Signal<Date | undefined> = computed( (): Date | undefined =>
            DateHelper.buildDate( this.store.currentMovements.withActivity.params.endDateTimeSearched() ),
        )

    public readonly currentAlertsPageError: Signal<ToastMessageOptions | undefined> = this.store.alerts.error

    public readonly currentAlertsPage: Signal<PageModel<AlertModel> | undefined> = this.store.alerts.element

    public loadProjectHomeInformation (): void {
        const projectId: string | undefined = this.selectedProjectId()
        this.store.fetchParticipantsStatus( projectId )
        this.store.fetchParticipantsBirthdays( projectId )
        if (ProjectHelper.hasOption( this.sessionFacade.selectedProject(), ProjectOptionEnum.VEHICLE )) {
            this.store.fetchVehiclesStatus( projectId )
        }
    }

    public fetchVehiclesStatus (): void {
        this.store.fetchVehiclesStatus( this.selectedProjectId() )
    }

    public fetchCurrentMovementsPageWithoutActivity (pageNumber: number | undefined, pageSize: number | undefined): void {
        this.store.fetchCurrentMovementsPageWithoutActivity( {
            projectId: this.selectedProjectId(),
            pageNumber: pageNumber,
            pageSize: pageSize,
        } )
    }

    public fetchCurrentMovementsWithoutActivityDetails (movementIds: string[]): void {
        this.store.fetchCurrentMovementsWithoutActivityContents( { projectId: this.selectedProjectId(), movementIds: movementIds } )
    }

    public fetchCurrentMovementsPageWithActivity (pageNumber: number | undefined, pageSize: number | undefined): void {
        this.store.fetchCurrentMovementsPageWithActivity( {
            projectId: this.selectedProjectId(),
            pageNumber: pageNumber,
            pageSize: pageSize,
        } )
    }

    public fetchCurrentMovementsWithActivityDetails (movementIds: string[]): void {
        this.store.fetchCurrentMovementsWithActivityContents( { projectId: this.selectedProjectId(), movementIds: movementIds } )
    }

    public fetchCurrentAlertsPage (pageNumber: number | undefined, pageSize: number | undefined): void {
        this.store.fetchCurrentAlertsPage( { projectId: this.selectedProjectId(), pageNumber: pageNumber, pageSize: pageSize } )
    }

    private get selectedProjectId (): Signal<string | undefined> {
        return this.sessionFacade.currentProjectId
    }
}
