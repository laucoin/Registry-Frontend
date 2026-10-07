import { computed, Injectable, Signal } from '@angular/core'
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { ToastMessageOptions } from 'primeng/api'
import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { DateHelper } from '@shared/helpers/date.helper'
import { GenericFacade } from '@shared/helpers/facade/generic.facade'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { RegistryStore } from '@core/registry/state/registry.store'
import {
    FetchCurrentAlertsPage,
    FetchCurrentMovementsPageWithActivity,
    FetchCurrentMovementsPageWithoutActivity,
    FetchCurrentMovementsWithActivityContents,
    FetchCurrentMovementsWithoutActivityContents,
    FetchParticipantsBirthdays,
    FetchParticipantsStatus,
    FetchVehiclesStatus,
    StartCurrentMovementsPageWithActivityLoader,
    StartCurrentMovementsPageWithoutActivityLoader,
    StartParticipantsStatusLoader,
    StartVehiclesStatusLoader,
    StopCurrentMovementsPageWithActivityLoader,
    StopCurrentMovementsPageWithoutActivityLoader,
    StopParticipantsStatusLoader,
    StopVehiclesStatusLoader,
} from '@pages/projects/data/state/selected-project/selected-project.action'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ProjectHelper } from '@shared/helpers/project.helper'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { ProjectModel } from '@shared/models/model/project.model'
import { AlertModel } from '@shared/models/model/alert.model'

@Injectable()
export class SelectedProjectFacade extends GenericFacade {
    public get participantsStatus (): Signal<ProjectStatusModel | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.participantsStatus )
    }

    public get participantsStatusLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.participantsStatusLoading )
    }

    public get participantsStatusError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.participantsStatusError )
    }

    public get vehiclesStatus (): Signal<VehicleStatusModel | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.vehiclesStatus )
    }

    public get vehiclesStatusLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.vehiclesStatusLoading )
    }

    public get vehiclesStatusError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.vehiclesStatusError )
    }

    public get participantsBirthdays (): Signal<ParticipantModel[]> {
        return this.ngStore.selectSignal( SelectedProjectStore.participantsBirthdays )
    }

    public get currentMovementsPageWithoutActivityLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithoutActivityLoading )
    }

    public get currentMovementsPageWithoutActivitySilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithoutActivitySilentLoading )
    }

    public get currentMovementsPageWithoutActivityError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithoutActivityError )
    }

    public get currentMovementsPageWithoutActivity (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithoutActivity )
    }

    private get currentMovementsPageWithoutActivityResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithoutActivityResetSearch )
    }

    public get currentMovementsPageWithoutActivityStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateHelper.buildDate( this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithoutActivityStartDateTimeSearchedParam )() ),
        )
    }

    public get currentMovementsPageWithoutActivityEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateHelper.buildDate( this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithoutActivityEndDateTimeSearchedParam )() ),
        )
    }

    public get currentMovementsPageWithActivityLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithActivityLoading )
    }

    public get currentMovementsPageWithActivitySilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithActivitySilentLoading )
    }

    public get currentMovementsPageWithActivityError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithActivityError )
    }

    public get currentMovementsPageWithActivity (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithActivity )
    }

    private get currentMovementsPageWithActivityResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithActivityResetSearch )
    }

    public get currentMovementsPageWithActivityStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateHelper.buildDate( this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithActivityStartDateTimeSearchedParam )() ),
        )
    }

    public get currentMovementsPageWithActivityEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateHelper.buildDate( this.ngStore.selectSignal( SelectedProjectStore.currentMovementsPageWithActivityEndDateTimeSearchedParam )() ),
        )
    }

    public get currentAlertsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentAlertsPageError )
    }

    public get currentAlertsPage (): Signal<PageModel<AlertModel> | undefined> {
        return this.ngStore.selectSignal( SelectedProjectStore.currentAlertsPage )
    }

    public startParticipantsStatusLoader (): void {
        this.ngStore.dispatch( StartParticipantsStatusLoader )
    }

    public stopParticipantsStatusLoader (): void {
        this.ngStore.dispatch( StopParticipantsStatusLoader )
    }

    public loadProjectHomeInformation (force: boolean): void {
        const actions: object[] = [
            new FetchParticipantsStatus(
                this.ngStore.selectSignal( RegistryStore.currentUserSelectedProjectId )(),
                force,
            ),
            new FetchParticipantsBirthdays(
                this.ngStore.selectSignal( RegistryStore.currentUserSelectedProjectId )(),
                force,
            ),
        ]
        if (ProjectHelper.hasOption(
            this.ngStore.selectSignal( RegistryStore.currentUserSelectedProject )(),
            ProjectOptionEnum.VEHICLE,
        )) {
            actions.push(
                new FetchVehiclesStatus(
                    this.ngStore.selectSignal( RegistryStore.currentUserSelectedProjectId )(),
                    force,
                ),
            )
        }
        this.ngStore.dispatch( actions )
    }

    public startVehiclesStatusLoader (): void {
        this.ngStore.dispatch( StartVehiclesStatusLoader )
    }

    public stopVehiclesStatusLoader (): void {
        this.ngStore.dispatch( StopVehiclesStatusLoader )
    }

    public fetchVehiclesStatus (force: boolean): void {
        this.ngStore.dispatch( new FetchVehiclesStatus(
            this.ngStore.selectSignal( RegistryStore.currentUserSelectedProjectId )(),
            force,
        ) )
    }

    public startCurrentMovementsPageWithoutActivityLoader (): void {
        this.ngStore.dispatch( StartCurrentMovementsPageWithoutActivityLoader )
    }

    public stopCurrentMovementsPageWithoutActivityLoader (): void {
        this.ngStore.dispatch( StopCurrentMovementsPageWithoutActivityLoader )
    }

    public fetchCurrentMovementsPageWithoutActivity (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchCurrentMovementsPageWithoutActivity(
            this.ngStore.selectSignal( RegistryStore.currentUserSelectedProjectId )(),
            pageNumber,
            pageSize,
            force,
        ) )
    }

    public fetchCurrentMovementsWithoutActivityDetails (movementIds: string[]): void {
        const project: ProjectModel | undefined = this.ngStore.selectSignal( RegistryStore.currentUserSelectedProject )()
        this.ngStore.dispatch( new FetchCurrentMovementsWithoutActivityContents( project?.id, movementIds ) )
    }

    public startCurrentMovementsPageWithActivityLoader (): void {
        this.ngStore.dispatch( StartCurrentMovementsPageWithActivityLoader )
    }

    public stopCurrentMovementsPageWithActivityLoader (): void {
        this.ngStore.dispatch( StopCurrentMovementsPageWithActivityLoader )
    }

    public fetchCurrentMovementsPageWithActivity (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchCurrentMovementsPageWithActivity(
            this.ngStore.selectSignal( RegistryStore.currentUserSelectedProjectId )(),
            pageNumber,
            pageSize,
            force,
        ) )
    }

    public fetchCurrentMovementsWithActivityDetails (movementIds: string[]): void {
        const project: ProjectModel | undefined = this.ngStore.selectSignal( RegistryStore.currentUserSelectedProject )()
        this.ngStore.dispatch( new FetchCurrentMovementsWithActivityContents( project?.id, movementIds ) )
    }

    public fetchCurrentAlertsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchCurrentAlertsPage(
            this.ngStore.selectSignal( RegistryStore.currentUserSelectedProjectId )(),
            pageNumber,
            pageSize,
            force,
        ) )
    }
}
