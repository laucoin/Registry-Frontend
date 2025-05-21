import { computed, Injectable, Signal } from '@angular/core'
import { ProjectStatusModel } from '../../model/project-status.model'
import { ToastMessageOptions } from 'primeng/api'
import { VehicleStatusModel } from '../../model/vehicle-status.model'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'
import { DateUtil } from '../../../../../shared/util-tool/util/date.util'
import { GenericFacade } from '../../../../../shared/util-tool/facade/generic.facade'
import { SelectedProjectState } from './selected-project.state'
import { RegistryState } from '../../../../../shared/util-common/state/registry.state'
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
} from './selected-project.action'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { ProjectUtil } from '../../../../../shared/util-tool/util/project.util'
import { ProjectOptionEnum } from '../../../../../shared/util-model/enumeration/project-option.enum'
import { ProjectModel } from '../../../../../shared/util-model/model/project.model'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'

@Injectable()
export class SelectedProjectFacade extends GenericFacade {
    public get participantsStatus (): Signal<ProjectStatusModel | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.participantsStatus )
    }

    public get participantsStatusLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.participantsStatusLoading )
    }

    public get participantsStatusError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.participantsStatusError )
    }

    public get vehiclesStatus (): Signal<VehicleStatusModel | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.vehiclesStatus )
    }

    public get vehiclesStatusLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.vehiclesStatusLoading )
    }

    public get vehiclesStatusError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.vehiclesStatusError )
    }

    public get participantsBirthdays (): Signal<ParticipantModel[]> {
        return this.ngStore.selectSignal( SelectedProjectState.participantsBirthdays )
    }

    public get currentMovementsPageWithoutActivityLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithoutActivityLoading )
    }

    public get currentMovementsPageWithoutActivitySilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithoutActivitySilentLoading )
    }

    public get currentMovementsPageWithoutActivityError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithoutActivityError )
    }

    public get currentMovementsPageWithoutActivity (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithoutActivity )
    }

    private get currentMovementsPageWithoutActivityResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithoutActivityResetSearch )
    }

    public get currentMovementsPageWithoutActivityStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithoutActivityStartDateTimeSearchedParam )() ),
        )
    }

    public get currentMovementsPageWithoutActivityEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithoutActivityEndDateTimeSearchedParam )() ),
        )
    }

    public get currentMovementsPageWithActivityLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithActivityLoading )
    }

    public get currentMovementsPageWithActivitySilentLoading (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithActivitySilentLoading )
    }

    public get currentMovementsPageWithActivityError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithActivityError )
    }

    public get currentMovementsPageWithActivity (): Signal<PageModel<MovementModel> | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithActivity )
    }

    private get currentMovementsPageWithActivityResetSearch (): Signal<boolean> {
        return this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithActivityResetSearch )
    }

    public get currentMovementsPageWithActivityStartDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithActivityStartDateTimeSearchedParam )() ),
        )
    }

    public get currentMovementsPageWithActivityEndDateTimeSearchedParam (): Signal<Date | undefined> {
        return computed( (): Date | undefined =>
            DateUtil.buildDate( this.ngStore.selectSignal( SelectedProjectState.currentMovementsPageWithActivityEndDateTimeSearchedParam )() ),
        )
    }

    public get currentAlertsPageError (): Signal<ToastMessageOptions | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.currentAlertsPageError )
    }

    public get currentAlertsPage (): Signal<PageModel<AlertModel> | undefined> {
        return this.ngStore.selectSignal( SelectedProjectState.currentAlertsPage )
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
                this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )(),
                force,
            ),
            new FetchParticipantsBirthdays(
                this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )(),
                force,
            ),
        ]
        if (ProjectUtil.hasOption(
            this.ngStore.selectSignal( RegistryState.currentUserSelectedProject )(),
            ProjectOptionEnum.VEHICLE,
        )) {
            actions.push(
                new FetchVehiclesStatus(
                    this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )(),
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
            this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )(),
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
            this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )(),
            pageNumber,
            pageSize,
            force,
        ) )
    }

    public fetchCurrentMovementsWithoutActivityDetails (movementIds: string[]): void {
        const project: ProjectModel | undefined = this.ngStore.selectSignal( RegistryState.currentUserSelectedProject )()
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
            this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )(),
            pageNumber,
            pageSize,
            force,
        ) )
    }

    public fetchCurrentMovementsWithActivityDetails (movementIds: string[]): void {
        const project: ProjectModel | undefined = this.ngStore.selectSignal( RegistryState.currentUserSelectedProject )()
        this.ngStore.dispatch( new FetchCurrentMovementsWithActivityContents( project?.id, movementIds ) )
    }

    public fetchCurrentAlertsPage (
        pageNumber: number | undefined,
        pageSize: number | undefined,
        force: boolean,
    ): void {
        this.ngStore.dispatch( new FetchCurrentAlertsPage(
            this.ngStore.selectSignal( RegistryState.currentUserSelectedProjectId )(),
            pageNumber,
            pageSize,
            force,
        ) )
    }
}
