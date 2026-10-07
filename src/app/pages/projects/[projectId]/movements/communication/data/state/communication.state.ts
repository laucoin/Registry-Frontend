import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementState } from '@shared/helpers/state/generic-project-element.state'
import { initialize } from '@shared/helpers/util/rx.util'
import { StateUtil } from '@shared/helpers/state/state.util'
import { inject, Injectable } from '@angular/core'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '@shared/models/model/error.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { CommunicationStateModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-state.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import {
    FetchCommunication,
    FetchCommunicationsPage,
    ResetCommunication,
    ResetCommunicationState,
    SearchAlerts,
    SearchMovements,
    StartCommunicationLoader,
    StartCommunicationsPageLoader,
    StopCommunicationLoader,
    StopCommunicationsPageLoader,
    UpdateCommunicationsPageSearchParams,
} from '@pages/projects/[projectId]/movements/communication/data/state/communication.action'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementUtil } from '@shared/helpers/util/movement.util'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertUtil } from '@shared/helpers/util/alert.util'

const defaultCommunication: ElementRequestInformationModel<CommunicationModel> = {
    element: undefined,
    loading: false,
}

const defaultCommunicationState: CommunicationStateModel = {
    communications: {
        element: undefined,
        params: {
            resetSearch: false,
            textSearched: undefined,
            visibilitySearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    communication: defaultCommunication,
    _metadata: {
        searchedMovements: [],
        searchedAlerts: [],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'communications.visible.true', value: true },
            { label: 'communications.visible.false', value: false },
        ],
    },
}

@State<CommunicationStateModel>( {
    name: 'communication',
    defaults: defaultCommunicationState,
} )
@Injectable()
export class CommunicationState extends GenericProjectElementState<CommunicationStateModel> {
    private readonly api: CommunicationApi = inject( CommunicationApi )
    private readonly facade: CommunicationFacade = inject( CommunicationFacade )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    @Selector()
    public static communicationsPage (state: CommunicationStateModel): PageModel<CommunicationModel> | undefined {
        return state.communications.element
    }

    @Selector()
    public static communicationsPageLoading (state: CommunicationStateModel): boolean {
        return state.communications.loading
    }

    @Selector()
    public static communicationsPageError (state: CommunicationStateModel): ToastMessageOptions | undefined {
        return state.communications.error
    }

    @Selector()
    public static communicationsPageSilentLoading (state: CommunicationStateModel): boolean {
        return state.communications.silentLoading
    }

    @Selector()
    public static communicationsPageResetSearch (state: CommunicationStateModel): boolean {
        return state.communications.params.resetSearch
    }

    @Selector()
    public static communicationsPageTextSearchedParam (state: CommunicationStateModel): string | undefined {
        return state.communications.params.textSearched
    }

    @Selector()
    public static communicationsPageVisibilitySearchedParam (state: CommunicationStateModel): boolean | undefined {
        return state.communications.params.visibilitySearched
    }

    @Selector()
    public static communicationsPageStartDateTimeSearchedParam (state: CommunicationStateModel): string | undefined {
        return state.communications.params.startDateTimeSearched
    }

    @Selector()
    public static communicationsPageEndDateTimeSearchedParam (state: CommunicationStateModel): string | undefined {
        return state.communications.params.endDateTimeSearched
    }

    @Selector()
    public static communication (state: CommunicationStateModel): CommunicationModel | undefined {
        return state.communication.element
    }

    @Selector()
    public static communicationLoading (state: CommunicationStateModel): boolean {
        return state.communication.loading
    }

    @Selector()
    public static searchedMovementsMetadata (state: CommunicationStateModel): SelectItem<MovementModel>[] {
        return state._metadata.searchedMovements
    }

    @Selector()
    public static searchedAlertsMetadata (state: CommunicationStateModel): SelectItem<AlertModel>[] {
        return state._metadata.searchedAlerts
    }

    @Selector()
    public static visibilitiesMetadata (state: CommunicationStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetCommunicationState )
    public resetCommunicationState (ctx: StateContext<CommunicationStateModel>): void {
        ctx.setState( defaultCommunicationState )
    }

    @Action( StartCommunicationsPageLoader )
    public startCommunicationsPageLoader (ctx: StateContext<CommunicationStateModel>): void {
        ctx.patchState( {
            communications: StateUtil.updatePageLoader( ctx.getState().communications, true ),
        } )
    }

    @Action( StopCommunicationsPageLoader )
    public stopCommunicationsPageLoader (ctx: StateContext<CommunicationStateModel>): void {
        ctx.patchState( {
            communications: StateUtil.updatePageLoader( ctx.getState().communications, false ),
        } )
    }

    @Action( FetchCommunicationsPage )
    public fetchCommunicationsPage (
        ctx: StateContext<CommunicationStateModel>,
        payload: FetchCommunicationsPage,
    ): Observable<void> {
        return this.api.findCommunications(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().communications.params,
        ).pipe(
            initialize( (): void => this.facade.startCommunicationsPageLoader() ),
            finalize( (): void => this.facade.stopCommunicationsPageLoader() ),
            map( (communicationsPage: PageModel<CommunicationModel>): void => this.fetchCommunicationsPageComplete(
                ctx,
                communicationsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchCommunicationsPageComplete (
        ctx: StateContext<CommunicationStateModel>,
        communicationsPage: PageModel<CommunicationModel>,
    ): void {
        ctx.patchState( {
            communications: {
                ...ctx.getState().communications,
                params: {
                    ...ctx.getState().communications.params,
                    resetSearch: false,
                },
                element: communicationsPage,
            },
        } )
    }

    @Action( UpdateCommunicationsPageSearchParams )
    public updateCommunicationsPageSearchParams (
        ctx: StateContext<CommunicationStateModel>,
        payload: UpdateCommunicationsPageSearchParams,
    ): void {
        ctx.patchState( {
            communications: {
                ...ctx.getState().communications,
                params: payload.params,
            },
        } )
    }

    @Action( StartCommunicationLoader )
    public startCommunicationLoader (ctx: StateContext<CommunicationStateModel>): void {
        ctx.patchState( {
            communication: StateUtil.updateElementLoader( ctx.getState().communication, true ),
        } )
    }

    @Action( StopCommunicationLoader )
    public stopCommunicationLoader (ctx: StateContext<CommunicationStateModel>): void {
        ctx.patchState( {
            communication: StateUtil.updateElementLoader( ctx.getState().communication, false ),
        } )
    }

    @Action( FetchCommunication )
    public fetchCommunication (
        ctx: StateContext<CommunicationStateModel>,
        payload: FetchCommunication,
    ): Observable<void> {
        return this.api.findCommunicationById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (communication: CommunicationModel): void => this.fetchCommunicationComplete( ctx, communication ) ),
        )
    }

    private fetchCommunicationComplete (
        ctx: StateContext<CommunicationStateModel>,
        communication: CommunicationModel,
    ): void {
        ctx.patchState( {
            communication: {
                ...ctx.getState().communication,
                element: communication,
            },
        } )
    }

    @Action( SearchMovements )
    public searchMovements (
        ctx: StateContext<CommunicationStateModel>,
        payload: SearchMovements,
    ): Observable<void> {
        return this.api.searchMovements( payload.projectId, payload.textSearched ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (movements: MovementModel[]): void => this.searchMovementsComplete( ctx, movements ) ),
        )
    }

    private searchMovementsComplete (
        ctx: StateContext<CommunicationStateModel>,
        movements: MovementModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedMovements: movements.map( (movement: MovementModel): SelectItem<MovementModel> =>
                    MovementUtil.toActivitySelectItem( movement, this.datePipe ),
                ),
            },
        } )
    }

    @Action( SearchAlerts )
    public searchAlerts (
        ctx: StateContext<CommunicationStateModel>,
        payload: SearchAlerts,
    ): Observable<void> {
        return this.api.searchAlerts( payload.projectId, payload.textSearched ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (alerts: AlertModel[]): void => this.searchAlertsComplete( ctx, alerts ) ),
        )
    }

    private searchAlertsComplete (
        ctx: StateContext<CommunicationStateModel>,
        alerts: AlertModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedAlerts: alerts.map( (alert: AlertModel): SelectItem<AlertModel> =>
                    AlertUtil.toSelectItem( alert, this.datePipe ),
                ),
            },
        } )
    }

    @Action( ResetCommunication )
    public resetCommunication (ctx: StateContext<CommunicationStateModel>): void {
        ctx.patchState( {
            communication: defaultCommunication,
        } )
    }

    protected refreshPage (ctx: StateContext<CommunicationStateModel>): void {
        const page: PageModel<CommunicationModel> | undefined = ctx.getState().communications.element
        this.facade.fetchCommunicationsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected pageError (ctx: StateContext<CommunicationStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                communications: this.buildErrorMessage( ctx.getState().communications, error ),
            } )
        }

        return of()
    }
}
