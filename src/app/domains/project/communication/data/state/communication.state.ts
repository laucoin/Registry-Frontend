import { Action, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { GenericProjectElementState } from '../../../../../shared/util-tool/state/generic-project-element.state'
import { initialize } from '../../../../../shared/util-tool/util/rx.util'
import { StateUtil } from '../../../../../shared/util-tool/state/state.util'
import { inject, Injectable } from '@angular/core'
import {
    ElementRequestInformationModel,
} from '../../../../../shared/util-model/model/element-request-information.model'
import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../../../../shared/util-model/model/error.model'
import { DateFormatPipe } from '../../../../../shared/util-tool/pipe/date-format.pipe'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'
import { CommunicationStateModel } from '../model/communication-state.model'
import { CommunicationModel } from '../model/communication.model'
import { CommunicationService } from './communication.service'
import { CommunicationFacade } from './communication.facade'
import {
    CreateCommunication,
    DeleteCommunication,
    DisableCommunication,
    EnableCommunication,
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
    UpdateCommunication,
    UpdateCommunicationsPageSearchParams,
} from './communication.action'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'
import { MovementUtil } from '../../../../../shared/util-tool/util/movement.util'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import { AlertUtil } from '../../../../../shared/util-tool/util/alert.util'

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
    private readonly communicationIcon: string = 'pi pi-sort-alt'

    private readonly service: CommunicationService = inject( CommunicationService )
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
        return this.service.findCommunications(
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
        return this.service.findCommunicationById( payload.projectId, payload.id ).pipe(
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
        return this.service.searchMovements( payload.projectId, payload.textSearched ).pipe(
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
        return this.service.searchAlerts( payload.projectId, payload.textSearched ).pipe(
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

    @Action( CreateCommunication )
    public createCommunication (
        ctx: StateContext<CommunicationStateModel>,
        payload: CreateCommunication,
    ): Observable<void> {
        return this.service.createCommunication( payload.projectId, payload.communication ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (): void => this.createCommunicationComplete( ctx ) ),
        )
    }

    private createCommunicationComplete (
        ctx: StateContext<CommunicationStateModel>,
    ): void {
        this.refreshPage( ctx )
    }

    @Action( UpdateCommunication )
    public updateCommunication (
        ctx: StateContext<CommunicationStateModel>,
        payload: UpdateCommunication,
    ): Observable<void> {
        return this.service.updateCommunicationById( payload.projectId, payload.id, payload.communication ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (): void => this.updateCommunicationComplete( ctx ) ),
        )
    }

    private updateCommunicationComplete (
        ctx: StateContext<CommunicationStateModel>,
    ): void {
        this.refreshPage( ctx )
    }

    @Action( DisableCommunication )
    public disableCommunication (
        ctx: StateContext<CommunicationStateModel>,
        payload: DisableCommunication,
    ): Observable<void> {
        return this.service.disableCommunicationById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (communication: CommunicationModel): void => this.disableCommunicationComplete( ctx, communication ) ),
        )
    }

    private disableCommunicationComplete (
        ctx: StateContext<CommunicationStateModel>,
        communication: CommunicationModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `communications.notifications.disable.title`,
            `communications.notifications.disable.message`,
            this.communicationIcon,
            this.buildTranslationArgs( communication ),
        )
        this.refreshPage( ctx )
    }

    @Action( EnableCommunication )
    public enableCommunication (
        ctx: StateContext<CommunicationStateModel>,
        payload: EnableCommunication,
    ): Observable<void> {
        return this.service.enableCommunicationById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (communication: CommunicationModel): void => this.enableCommunicationComplete( ctx, communication ) ),
        )
    }

    private enableCommunicationComplete (
        ctx: StateContext<CommunicationStateModel>,
        communication: CommunicationModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `communications.notifications.enable.title`,
            `communications.notifications.enable.message`,
            this.communicationIcon,
            this.buildTranslationArgs( communication ),
        )
        this.refreshPage( ctx )
    }

    @Action( DeleteCommunication )
    public deleteCommunication (
        ctx: StateContext<CommunicationStateModel>,
        payload: DeleteCommunication,
    ): Observable<void> {
        return this.service.deleteCommunicationById( undefined, payload.communication.id ).pipe(
            initialize( (): void => this.facade.startCommunicationLoader() ),
            finalize( (): void => this.facade.stopCommunicationLoader() ),
            map( (): void => this.deleteCommunicationComplete( ctx, payload.communication ) ),
        )
    }

    private deleteCommunicationComplete (
        ctx: StateContext<CommunicationStateModel>,
        communication: CommunicationModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `communications.notifications.delete.title`,
            `communications.notifications.delete.message`,
            this.communicationIcon,
            this.buildTranslationArgs( communication ),
        )
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (communication: CommunicationModel): object {
        return {
            datetime: this.datePipe.transform( communication?.dateTime, 'datetime' ),
        }
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
