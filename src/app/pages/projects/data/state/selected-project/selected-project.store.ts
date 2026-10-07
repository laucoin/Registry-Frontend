import { Action, Selector, State, StateContext } from '@ngxs/store'
import { inject, Injectable } from '@angular/core'
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { ToastMessageOptions } from 'primeng/api'
import { VehicleStatusModel } from '@pages/projects/data/model/vehicle-status.model'
import { PageModel } from '@shared/models/model/page.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { SelectedProjectStoreModel } from '@pages/projects/data/model/selected-project-store.model'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { initialize } from '@shared/helpers/rx.helper'
import { ErrorModel } from '@shared/models/model/error.model'
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
} from '@pages/projects/data/state/selected-project/selected-project.action'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { AlertModel } from '@shared/models/model/alert.model'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { GenericStore } from '@shared/helpers/state/generic.store'

const defaultSelectedProjectStore: SelectedProjectStoreModel = {
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

@State<SelectedProjectStoreModel>( {
    name: 'selectedProject',
    defaults: defaultSelectedProjectStore,
} )
@Injectable()
export class SelectedProjectStore extends GenericStore {
    private readonly facade: SelectedProjectFacade = inject( SelectedProjectFacade )
    private readonly movementApi: MovementApi = inject( MovementApi )
    private readonly alertApi: AlertApi = inject( AlertApi )
    private readonly participantApi: ParticipantApi = inject( ParticipantApi )

    @Selector()
    public static participantsStatus (state: SelectedProjectStoreModel): ProjectStatusModel | undefined {
        return state.status.participants.element
    }

    @Selector()
    public static participantsStatusLoading (state: SelectedProjectStoreModel): boolean {
        return state.status.participants.loading
    }

    @Selector()
    public static participantsStatusError (state: SelectedProjectStoreModel): ToastMessageOptions | undefined {
        return state.status.participants.error
    }

    @Selector()
    public static vehiclesStatus (state: SelectedProjectStoreModel): VehicleStatusModel | undefined {
        return state.status.vehicles.element
    }

    @Selector()
    public static vehiclesStatusLoading (state: SelectedProjectStoreModel): boolean {
        return state.status.vehicles.loading
    }

    @Selector()
    public static vehiclesStatusError (state: SelectedProjectStoreModel): ToastMessageOptions | undefined {
        return state.status.vehicles.error
    }

    @Selector()
    public static participantsBirthdays (state: SelectedProjectStoreModel): ParticipantModel[] {
        return state.birthdays
    }

    @Selector()
    public static currentMovementsPageWithoutActivity (state: SelectedProjectStoreModel): PageModel<MovementModel> | undefined {
        return state.currentMovements.withoutActivity.element
    }

    @Selector()
    public static currentMovementsPageWithoutActivityLoading (state: SelectedProjectStoreModel): boolean {
        return state.currentMovements.withoutActivity.loading
    }

    @Selector()
    public static currentMovementsPageWithoutActivityError (state: SelectedProjectStoreModel): ToastMessageOptions | undefined {
        return state.currentMovements.withoutActivity.error
    }

    @Selector()
    public static currentMovementsPageWithoutActivitySilentLoading (state: SelectedProjectStoreModel): boolean {
        return state.currentMovements.withoutActivity.silentLoading
    }

    @Selector()
    public static currentMovementsPageWithoutActivityResetSearch (state: SelectedProjectStoreModel): boolean {
        return state.currentMovements.withoutActivity.params.resetSearch
    }

    @Selector()
    public static currentMovementsPageWithoutActivityStartDateTimeSearchedParam (state: SelectedProjectStoreModel): string | undefined {
        return state.currentMovements.withoutActivity.params.startDateTimeSearched
    }

    @Selector()
    public static currentMovementsPageWithoutActivityEndDateTimeSearchedParam (state: SelectedProjectStoreModel): string | undefined {
        return state.currentMovements.withoutActivity.params.endDateTimeSearched
    }

    @Selector()
    public static currentMovementsPageWithActivity (state: SelectedProjectStoreModel): PageModel<MovementModel> | undefined {
        return state.currentMovements.withActivity.element
    }

    @Selector()
    public static currentMovementsPageWithActivityLoading (state: SelectedProjectStoreModel): boolean {
        return state.currentMovements.withActivity.loading
    }

    @Selector()
    public static currentMovementsPageWithActivityError (state: SelectedProjectStoreModel): ToastMessageOptions | undefined {
        return state.currentMovements.withActivity.error
    }

    @Selector()
    public static currentMovementsPageWithActivitySilentLoading (state: SelectedProjectStoreModel): boolean {
        return state.currentMovements.withActivity.silentLoading
    }

    @Selector()
    public static currentMovementsPageWithActivityResetSearch (state: SelectedProjectStoreModel): boolean {
        return state.currentMovements.withActivity.params.resetSearch
    }

    @Selector()
    public static currentMovementsPageWithActivityStartDateTimeSearchedParam (state: SelectedProjectStoreModel): string | undefined {
        return state.currentMovements.withActivity.params.startDateTimeSearched
    }

    @Selector()
    public static currentMovementsPageWithActivityEndDateTimeSearchedParam (state: SelectedProjectStoreModel): string | undefined {
        return state.currentMovements.withActivity.params.endDateTimeSearched
    }

    @Selector()
    public static currentAlertsPageError (state: SelectedProjectStoreModel): ToastMessageOptions | undefined {
        return state.alerts.error
    }

    @Selector()
    public static currentAlertsPage (state: SelectedProjectStoreModel): PageModel<AlertModel> | undefined {
        return state.alerts.element
    }

    @Action( ResetSelectedProjectState )
    public resetSelectedProjectState (ctx: StateContext<SelectedProjectStoreModel>): void {
        ctx.setState( defaultSelectedProjectStore )
    }

    @Action( StartParticipantsStatusLoader )
    public startParticipantsStatusLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        this.updateParticipantsStatusLoader( ctx, true )
    }

    @Action( StopParticipantsStatusLoader )
    public stopParticipantsStatusLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        this.updateParticipantsStatusLoader( ctx, false )
    }

    private updateParticipantsStatusLoader (ctx: StateContext<SelectedProjectStoreModel>, loading: boolean): void {
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
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchParticipantsStatus,
    ): Observable<void> {
        return this.movementApi.findParticipantsStatus( payload.projectId ).pipe(
            initialize( (): void => this.facade.startParticipantsStatusLoader() ),
            finalize( (): void => this.facade.stopParticipantsStatusLoader() ),
            map( (status: ProjectStatusModel): void => this.fetchParticipantsStatusComplete( ctx, status ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchParticipantsStatusError( ctx, error ) ),
        )
    }

    private fetchParticipantsStatusComplete (
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
    public startVehiclesStatusLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        this.updateVehiclesStatusLoader( ctx, true )
    }

    @Action( StopVehiclesStatusLoader )
    public stopVehiclesStatusLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        this.updateVehiclesStatusLoader( ctx, false )
    }

    private updateVehiclesStatusLoader (ctx: StateContext<SelectedProjectStoreModel>, loading: boolean): void {
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
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchParticipantsStatus,
    ): Observable<void> {
        return this.movementApi.findVehiclesStatus( payload.projectId ).pipe(
            initialize( (): void => this.facade.startVehiclesStatusLoader() ),
            finalize( (): void => this.facade.stopVehiclesStatusLoader() ),
            map( (status: VehicleStatusModel): void => this.fetchVehiclesStatusComplete( ctx, status ) ),
            catchError( (error: ErrorModel): Observable<void> => this.fetchVehiclesStatusError( ctx, error ) ),
        )
    }

    private fetchVehiclesStatusComplete (
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchParticipantsStatus,
    ): Observable<void> {
        return this.participantApi.findParticipantsBirthdays( payload.projectId ).pipe(
            map( (participants: ParticipantModel[]): void => this.fetchParticipantsBirthdaysComplete(
                ctx,
                participants,
            ) ),
        )
    }

    private fetchParticipantsBirthdaysComplete (
        ctx: StateContext<SelectedProjectStoreModel>,
        participants: ParticipantModel[],
    ): void {
        ctx.patchState( {
            birthdays: participants,
        } )
    }

    @Action( StartCurrentMovementsPageWithoutActivityLoader )
    public startCurrentMovementsPageWithoutActivityLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withoutActivity: StateHelper.updatePageLoader( ctx.getState().currentMovements.withoutActivity, true ),
            },
        } )
    }

    @Action( StopCurrentMovementsPageWithoutActivityLoader )
    public stopCurrentMovementsPageWithoutActivityLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withoutActivity: StateHelper.updatePageLoader( ctx.getState().currentMovements.withoutActivity, false ),
            },
        } )
    }

    @Action( FetchCurrentMovementsPageWithoutActivity )
    public fetchCurrentMovementsPageWithoutActivity (
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchCurrentMovementsPageWithoutActivity,
    ): Observable<void> {
        return this.movementApi.findMovements(
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchCurrentMovementsWithoutActivityContents,
    ): Observable<void> {
        return this.movementApi.findMovementsContents(
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
                        content: MovementHelper.rebuildPageWithContent(
                            ctx.getState().currentMovements.withoutActivity.element!.content,
                            contents,
                        ),
                    },
                },
            },
        } )
    }

    @Action( StartCurrentMovementsPageWithActivityLoader )
    public startCurrentMovementsPageWithActivityLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withActivity: StateHelper.updatePageLoader( ctx.getState().currentMovements.withActivity, true ),
            },
        } )
    }

    @Action( StopCurrentMovementsPageWithActivityLoader )
    public stopCurrentMovementsPageWithActivityLoader (ctx: StateContext<SelectedProjectStoreModel>): void {
        ctx.patchState( {
            currentMovements: {
                ...ctx.getState().currentMovements,
                withActivity: StateHelper.updatePageLoader( ctx.getState().currentMovements.withActivity, false ),
            },
        } )
    }

    @Action( FetchCurrentMovementsPageWithActivity )
    public fetchCurrentMovementsPageWithActivity (
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchCurrentMovementsPageWithActivity,
    ): Observable<void> {
        return this.movementApi.findMovements(
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchCurrentMovementsWithActivityContents,
    ): Observable<void> {
        return this.movementApi.findMovementsContents(
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
                        content: MovementHelper.rebuildPageWithContent(
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
        ctx: StateContext<SelectedProjectStoreModel>,
        payload: FetchCurrentAlertsPage,
    ): Observable<void> {
        return this.alertApi.findAlerts(
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
        ctx: StateContext<SelectedProjectStoreModel>,
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
