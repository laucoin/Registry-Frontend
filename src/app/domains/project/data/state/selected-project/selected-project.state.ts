import { Action, Selector, State, StateContext } from '@ngxs/store'
import { inject, Injectable } from '@angular/core'
import { ProjectStatusModel } from '../../model/project-status.model'
import { ToastMessageOptions } from 'primeng/api'
import { VehicleStatusModel } from '../../model/vehicle-status.model'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'
import { SelectedProjectStateModel } from '../../model/selected-project-state.model'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { initialize } from '../../../../../shared/util-tool/util/rx.util'
import { ErrorModel } from '../../../../../shared/util-model/model/error.model'
import {
    FetchCurrentAlertsPage,
    FetchCurrentMovementsPageWithActivity,
    FetchCurrentMovementsPageWithoutActivity,
    FetchCurrentMovementsWithActivityContents,
    FetchCurrentMovementsWithoutActivityContents,
    FetchParticipantsBirthdays,
    FetchParticipantsStatus,
    FetchVehiclesStatus,
    ResetSelectedProjectState,
    StartCurrentMovementsPageWithActivityLoader,
    StartCurrentMovementsPageWithoutActivityLoader,
    StartParticipantsStatusLoader,
    StartVehiclesStatusLoader,
    StopCurrentMovementsPageWithActivityLoader,
    StopCurrentMovementsPageWithoutActivityLoader,
    StopParticipantsStatusLoader,
    StopVehiclesStatusLoader,
} from './selected-project.action'
import { MovementService } from '../../../movement/data/state/movement.service'
import { SelectedProjectFacade } from './selected-project.facade'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { ParticipantService } from '../../../configuration/participant/data/state/participant.service'
import { PairModel } from '../../../../../shared/util-model/model/pair.model'
import { MovementContentModel } from '../../../../../shared/util-model/model/movement-content.model'
import { MovementUtil } from '../../../../../shared/util-tool/util/movement.util'
import { AlertStatusEnum } from '../../../../../shared/util-model/enumeration/alert-status.enum'
import { AlertService } from '../../../movement/data/state/alert.service'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import { StateUtil } from '../../../../../shared/util-tool/state/state.util'
import { GenericState } from '../../../../../shared/util-tool/state/generic.state'

const defaultSelectedProjectState: SelectedProjectStateModel = {
    status: {
        participants: {
            element: undefined,
            loading: false,
            error: undefined,
        },
        vehicles: {
            element: undefined,
            loading: false,
            error: undefined,
        },
    },
    alerts: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            statusSearched: AlertStatusEnum.IN_PROGRESS,
            visibilitySearched: true,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    birthdays: [],
    currentMovements: {
        withoutActivity: {
            element: undefined,
            params: {
                resetSearch: false,
                currentMovements: true,
                linkedToActivity: false,
                visibilitySearched: undefined,
                typeSearched: undefined,
                startDateTimeSearched: undefined,
                endDateTimeSearched: undefined,
            },
            loading: false,
            silentLoading: false,
            error: undefined,
        },
        withActivity: {
            element: undefined,
            params: {
                resetSearch: false,
                currentMovements: true,
                linkedToActivity: true,
                visibilitySearched: undefined,
                typeSearched: undefined,
                startDateTimeSearched: undefined,
                endDateTimeSearched: undefined,
            },
            loading: false,
            silentLoading: false,
            error: undefined,
        },
    },
}

@State<SelectedProjectStateModel>( {
    name: 'selectedProject',
    defaults: defaultSelectedProjectState,
} )
@Injectable()
export class SelectedProjectState extends GenericState {
    private readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    private readonly movementService: MovementService = inject( MovementService )
    private readonly alertService: AlertService = inject( AlertService )
    private readonly participantService: ParticipantService = inject( ParticipantService )

    @Selector()
    public static participantsStatus (state: SelectedProjectStateModel): ProjectStatusModel | undefined {
        return state.status.participants.element
    }

    @Selector()
    public static participantsStatusLoading (state: SelectedProjectStateModel): boolean {
        return state.status.participants.loading
    }

    @Selector()
    public static participantsStatusError (state: SelectedProjectStateModel): ToastMessageOptions | undefined {
        return state.status.participants.error
    }

    @Selector()
    public static vehiclesStatus (state: SelectedProjectStateModel): VehicleStatusModel | undefined {
        return state.status.vehicles.element
    }

    @Selector()
    public static vehiclesStatusLoading (state: SelectedProjectStateModel): boolean {
        return state.status.vehicles.loading
    }

    @Selector()
    public static vehiclesStatusError (state: SelectedProjectStateModel): ToastMessageOptions | undefined {
        return state.status.vehicles.error
    }

    @Selector()
    public static participantsBirthdays (state: SelectedProjectStateModel): ParticipantModel[] {
        return state.birthdays
    }

    @Selector()
    public static currentMovementsPageWithoutActivity (state: SelectedProjectStateModel): PageModel<MovementModel> | undefined {
        return state.currentMovements.withoutActivity.element
    }

    @Selector()
    public static currentMovementsPageWithoutActivityLoading (state: SelectedProjectStateModel): boolean {
        return state.currentMovements.withoutActivity.loading
    }

    @Selector()
    public static currentMovementsPageWithoutActivityError (state: SelectedProjectStateModel): ToastMessageOptions | undefined {
        return state.currentMovements.withoutActivity.error
    }

    @Selector()
    public static currentMovementsPageWithoutActivitySilentLoading (state: SelectedProjectStateModel): boolean {
        return state.currentMovements.withoutActivity.silentLoading
    }

    @Selector()
    public static currentMovementsPageWithoutActivityResetSearch (state: SelectedProjectStateModel): boolean {
        return state.currentMovements.withoutActivity.params.resetSearch
    }

    @Selector()
    public static currentMovementsPageWithoutActivityStartDateTimeSearchedParam (state: SelectedProjectStateModel): string | undefined {
        return state.currentMovements.withoutActivity.params.startDateTimeSearched
    }

    @Selector()
    public static currentMovementsPageWithoutActivityEndDateTimeSearchedParam (state: SelectedProjectStateModel): string | undefined {
        return state.currentMovements.withoutActivity.params.endDateTimeSearched
    }

    @Selector()
    public static currentMovementsPageWithActivity (state: SelectedProjectStateModel): PageModel<MovementModel> | undefined {
        return state.currentMovements.withActivity.element
    }

    @Selector()
    public static currentMovementsPageWithActivityLoading (state: SelectedProjectStateModel): boolean {
        return state.currentMovements.withActivity.loading
    }

    @Selector()
    public static currentMovementsPageWithActivityError (state: SelectedProjectStateModel): ToastMessageOptions | undefined {
        return state.currentMovements.withActivity.error
    }

    @Selector()
    public static currentMovementsPageWithActivitySilentLoading (state: SelectedProjectStateModel): boolean {
        return state.currentMovements.withActivity.silentLoading
    }

    @Selector()
    public static currentMovementsPageWithActivityResetSearch (state: SelectedProjectStateModel): boolean {
        return state.currentMovements.withActivity.params.resetSearch
    }

    @Selector()
    public static currentMovementsPageWithActivityStartDateTimeSearchedParam (state: SelectedProjectStateModel): string | undefined {
        return state.currentMovements.withActivity.params.startDateTimeSearched
    }

    @Selector()
    public static currentMovementsPageWithActivityEndDateTimeSearchedParam (state: SelectedProjectStateModel): string | undefined {
        return state.currentMovements.withActivity.params.endDateTimeSearched
    }

    @Selector()
    public static currentAlertsPageError (state: SelectedProjectStateModel): ToastMessageOptions | undefined {
        return state.alerts.error
    }

    @Selector()
    public static currentAlertsPage (state: SelectedProjectStateModel): PageModel<AlertModel> | undefined {
        return state.alerts.element
    }

    @Action( ResetSelectedProjectState )
    public resetSelectedProjectState (ctx: StateContext<SelectedProjectStateModel>): void {
        ctx.setState( defaultSelectedProjectState )
    }

    @Action( StartParticipantsStatusLoader )
    public startParticipantsStatusLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        this.updateParticipantsStatusLoader( ctx, true )
    }

    @Action( StopParticipantsStatusLoader )
    public stopParticipantsStatusLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        this.updateParticipantsStatusLoader( ctx, false )
    }

    private updateParticipantsStatusLoader (ctx: StateContext<SelectedProjectStateModel>, loading: boolean): void {
        ctx.patchState( {
            status: {
                ...ctx.getState().status,
                participants: {
                    ...ctx.getState().status.participants,
                    loading: loading,
                },
            },
        } )
    }

    @Action( FetchParticipantsStatus )
    public fetchParticipantsStatus (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchParticipantsStatus,
    ): Observable<void> {
        return this.movementService.findParticipantsStatus( payload.projectId ).pipe(
            initialize( (): void => this.facade.startParticipantsStatusLoader() ),
            finalize( (): void => this.facade.stopParticipantsStatusLoader() ),
            map( (status: ProjectStatusModel): void => this.fetchParticipantsStatusComplete( ctx, status ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchParticipantsStatusError( ctx, error ) ),
        )
    }

    private fetchParticipantsStatusComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        status: ProjectStatusModel,
    ): void {
        ctx.patchState( {
            status: {
                ...ctx.getState().status,
                participants: {
                    ...ctx.getState().status.participants,
                    element: status,
                },
            },
        } )
    }

    private fetchParticipantsStatusError (
        ctx: StateContext<SelectedProjectStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                status: {
                    ...ctx.getState().status,
                    participants: {
                        ...ctx.getState().status.participants,
                        error: {
                            severity: 'error',
                            summary: error.title,
                            detail: error.message,
                            icon: 'pi pi-exclamation-triangle',
                            closable: true,
                        },
                    },
                },
            } )
        }

        return of()
    }

    @Action( StartVehiclesStatusLoader )
    public startVehiclesStatusLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        this.updateVehiclesStatusLoader( ctx, true )
    }

    @Action( StopVehiclesStatusLoader )
    public stopVehiclesStatusLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        this.updateVehiclesStatusLoader( ctx, false )
    }

    private updateVehiclesStatusLoader (ctx: StateContext<SelectedProjectStateModel>, loading: boolean): void {
        ctx.patchState( {
            status: {
                ...ctx.getState().status,
                participants: {
                    ...ctx.getState().status.participants,
                    loading: loading,
                },
            },
        } )
    }

    @Action( FetchVehiclesStatus )
    public fetchVehiclesStatus (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchParticipantsStatus,
    ): Observable<void> {
        return this.movementService.findVehiclesStatus( payload.projectId ).pipe(
            initialize( (): void => this.facade.startVehiclesStatusLoader() ),
            finalize( (): void => this.facade.stopVehiclesStatusLoader() ),
            map( (status: VehicleStatusModel): void => this.fetchVehiclesStatusComplete( ctx, status ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchVehiclesStatusError( ctx, error ) ),
        )
    }

    private fetchVehiclesStatusComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        status: VehicleStatusModel,
    ): void {
        ctx.patchState( {
            status: {
                ...ctx.getState().status,
                vehicles: {
                    ...ctx.getState().status.vehicles,
                    element: status,
                },
            },
        } )
    }

    private fetchVehiclesStatusError (
        ctx: StateContext<SelectedProjectStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                status: {
                    ...ctx.getState().status,
                    vehicles: {
                        ...ctx.getState().status.vehicles,
                        error: {
                            severity: 'error',
                            summary: error.title,
                            detail: error.message,
                            icon: 'pi pi-exclamation-triangle',
                            closable: true,
                        },
                    },
                },
            } )
        }

        return of()
    }

    @Action( FetchParticipantsBirthdays )
    public fetchParticipantsBirthdays (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchParticipantsStatus,
    ): Observable<void> {
        return this.participantService.findParticipantsBirthdays( payload.projectId ).pipe(
            map( (participants: ParticipantModel[]): void => this.fetchParticipantsBirthdaysComplete(
                ctx,
                participants,
            ) ),
        )
    }

    private fetchParticipantsBirthdaysComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        participants: ParticipantModel[],
    ): void {
        ctx.patchState( {
            birthdays: participants,
        } )
    }

    @Action( StartCurrentMovementsPageWithoutActivityLoader )
    public startCurrentMovementsPageWithoutActivityLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withoutActivity: StateUtil.updatePageLoader( ctx.getState().currentMovements.withoutActivity, true ),
            },
        } )
    }

    @Action( StopCurrentMovementsPageWithoutActivityLoader )
    public stopCurrentMovementsPageWithoutActivityLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withoutActivity: StateUtil.updatePageLoader( ctx.getState().currentMovements.withoutActivity, false ),
            },
        } )
    }

    @Action( FetchCurrentMovementsPageWithoutActivity )
    public fetchCurrentMovementsPageWithoutActivity (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchCurrentMovementsPageWithoutActivity,
    ): Observable<void> {
        return this.movementService.findMovements(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().currentMovements.withoutActivity.params,
        ).pipe(
            initialize( (): void => this.facade.startCurrentMovementsPageWithoutActivityLoader() ),
            finalize( (): void => this.facade.stopCurrentMovementsPageWithoutActivityLoader() ),
            map( (page: PageModel<MovementModel>): void => this.fetchCurrentMovementsPageWithoutActivityComplete(
                ctx,
                page,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchCurrentMovementsPageWithoutActivityError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchCurrentMovementsPageWithoutActivityComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withoutActivity: {
                    ...ctx.getState().currentMovements.withoutActivity,
                    element: movementsPage,
                },
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchCurrentMovementsWithoutActivityDetails(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
            )
        }
    }

    private fetchCurrentMovementsPageWithoutActivityError (
        ctx: StateContext<SelectedProjectStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                currentMovements: {
                    ...ctx.getState().currentMovements,
                    withoutActivity: this.buildErrorMessage( ctx.getState().currentMovements.withoutActivity, error ),
                },
            } )
        }

        return of()
    }

    @Action( FetchCurrentMovementsWithoutActivityContents )
    public fetchCurrentMovementsWithoutActivityContents (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchCurrentMovementsWithoutActivityContents,
    ): Observable<void> {
        return this.movementService.findMovementsContents(
            payload.projectId,
            payload.movementIds,
            ctx.getState().currentMovements.withoutActivity.params.currentMovements,
        ).pipe(
            map( (contents: PairModel<MovementContentModel[]>[]): void => this.fetchCurrentMovementsWithoutActivityContentsComplete(
                ctx,
                contents,
            ) ),
        )
    }

    private fetchCurrentMovementsWithoutActivityContentsComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        contents: PairModel<MovementContentModel[]>[],
    ): void {
        if (!ctx.getState().currentMovements.withoutActivity.element) {
            return
        }

        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withoutActivity: {
                    ...ctx.getState().currentMovements.withoutActivity,
                    element: {
                        ...ctx.getState().currentMovements.withoutActivity.element!,
                        content: MovementUtil.rebuildPageWithContent(
                            ctx.getState().currentMovements.withoutActivity.element!.content,
                            contents,
                        ),
                    },
                },
            },
        } )
    }

    @Action( StartCurrentMovementsPageWithActivityLoader )
    public startCurrentMovementsPageWithActivityLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withActivity: StateUtil.updatePageLoader( ctx.getState().currentMovements.withActivity, true ),
            },
        } )
    }

    @Action( StopCurrentMovementsPageWithActivityLoader )
    public stopCurrentMovementsPageWithActivityLoader (ctx: StateContext<SelectedProjectStateModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withActivity: StateUtil.updatePageLoader( ctx.getState().currentMovements.withActivity, false ),
            },
        } )
    }

    @Action( FetchCurrentMovementsPageWithActivity )
    public fetchCurrentMovementsPageWithActivity (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchCurrentMovementsPageWithActivity,
    ): Observable<void> {
        return this.movementService.findMovements(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().currentMovements.withActivity.params,
        ).pipe(
            initialize( (): void => this.facade.startCurrentMovementsPageWithActivityLoader() ),
            finalize( (): void => this.facade.stopCurrentMovementsPageWithActivityLoader() ),
            map( (page: PageModel<MovementModel>): void => this.fetchCurrentMovementsPageWithActivityComplete(
                ctx,
                page,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchCurrentMovementsPageWithActivityError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchCurrentMovementsPageWithActivityComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withActivity: {
                    ...ctx.getState().currentMovements.withActivity,
                    element: movementsPage,
                },
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchCurrentMovementsWithActivityDetails(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
            )
        }
    }

    private fetchCurrentMovementsPageWithActivityError (
        ctx: StateContext<SelectedProjectStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                currentMovements: {
                    ...ctx.getState().currentMovements,
                    withActivity: this.buildErrorMessage( ctx.getState().currentMovements.withActivity, error ),
                },
            } )
        }

        return of()
    }

    @Action( FetchCurrentMovementsWithActivityContents )
    public fetchCurrentMovementsWithActivityContents (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchCurrentMovementsWithActivityContents,
    ): Observable<void> {
        return this.movementService.findMovementsContents(
            payload.projectId,
            payload.movementIds,
            ctx.getState().currentMovements.withActivity.params.currentMovements,
        ).pipe(
            map( (contents: PairModel<MovementContentModel[]>[]): void => this.fetchCurrentMovementsWithActivityContentsComplete(
                ctx,
                contents,
            ) ),
        )
    }

    private fetchCurrentMovementsWithActivityContentsComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        contents: PairModel<MovementContentModel[]>[],
    ): void {
        if (!ctx.getState().currentMovements.withActivity.element) {
            return
        }

        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withActivity: {
                    ...ctx.getState().currentMovements.withActivity,
                    element: {
                        ...ctx.getState().currentMovements.withActivity.element!,
                        content: MovementUtil.rebuildPageWithContent(
                            ctx.getState().currentMovements.withActivity.element!.content,
                            contents,
                        ),
                    },
                },
            },
        } )
    }

    @Action( FetchCurrentAlertsPage )
    public fetchCurrentAlertsPage (
        ctx: StateContext<SelectedProjectStateModel>,
        payload: FetchCurrentAlertsPage,
    ): Observable<void> {
        return this.alertService.findAlerts(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().alerts.params,
        ).pipe(
            map( (page: PageModel<AlertModel>): void => this.fetchCurrentAlertsPageComplete(
                ctx,
                page,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchCurrentAlertsPageError(
                ctx,
                error,
            ) ),
        )
    }

    private fetchCurrentAlertsPageComplete (
        ctx: StateContext<SelectedProjectStateModel>,
        alertsPage: PageModel<AlertModel>,
    ): void {
        ctx.patchState( {
            alerts: {
                ...ctx.getState().alerts,
                element: alertsPage,
            },
        } )
    }

    private fetchCurrentAlertsPageError (
        ctx: StateContext<SelectedProjectStateModel>,
        error: ErrorModel,
    ): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                alerts: this.buildErrorMessage( ctx.getState().alerts, error ),
            } )
        }

        return of()
    }
}
