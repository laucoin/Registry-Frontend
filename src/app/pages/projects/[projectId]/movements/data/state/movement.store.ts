import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '@shared/models/model/page.model'
import { GenericProjectElementStore } from '@shared/helpers/state/generic-project-element.store'
import { initialize } from '@shared/helpers/rx.helper'
import {
    FetchMovementCommunicationsPage,
    FetchMovementsContent,
    FetchMovementsPage,
    FetchMovementTypes,
    FetchParticipantTypes,
    ResetMovementState,
    SearchParticipantsAndGroups,
    SearchReasonsAndActivities,
    SearchVehicles,
    StartMovementCommunicationsPageLoader,
    StartMovementsPageLoader,
    StopMovementCommunicationsPageLoader,
    StopMovementsPageLoader,
    UpdateMovementCommunicationsPageSearchParams,
    UpdateMovementsPageSearchParams,
} from '@pages/projects/[projectId]/movements/data/state/movement.action'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { inject, Injectable } from '@angular/core'
import { GroupModel } from '@shared/models/model/group.model'
import { GroupHelper } from '@shared/helpers/group.helper'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '@shared/models/model/error.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementStoreModel } from '@pages/projects/[projectId]/movements/data/model/movement-store.model'
import {
    MovementParticipantsAndGroupsModel,
} from '@shared/models/model/movement-participants-and-groups.model'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { VehicleHelper } from '@shared/helpers/vehicle.helper'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { MovementReasonModel } from '@pages/projects/[projectId]/movements/data/model/movement-reason.model'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'

const defaultMovementStore: MovementStoreModel = {
    movements: {
        element: undefined,
        params: {
            resetSearch: false,
            currentMovements: false,
            linkedToActivity: undefined,
            visibilitySearched: undefined,
            typeSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    movementCommunications: {
        element: undefined,
        params: {
            resetSearch: false,
            visibilitySearched: true,
            textSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        },
        loading: false,
        silentLoading: false,
        error: undefined,
    },
    _metadata: {
        types: [],
        participantTypes: [],
        searchedReasonsAndActivities: [],
        searchedParticipantsAndGroups: [],
        searchedVehicles: [],
        visibilities: [
            { label: '-', value: undefined },
            { label: 'movements.visible.true', value: true },
            { label: 'movements.visible.false', value: false },
        ],
    },
}

@State<MovementStoreModel>( {
    name: 'movement',
    defaults: defaultMovementStore,
} )
@Injectable()
export class MovementStore extends GenericProjectElementStore<MovementStoreModel> implements NgxsOnInit {
    private readonly api: MovementApi = inject( MovementApi )
    private readonly metadataApi: MetadataApi = inject( MetadataApi )
    private readonly facade: MovementFacade = inject( MovementFacade )
    private readonly pluralTranslationPipe: PluralTranslationPipe = inject( PluralTranslationPipe )
    private readonly datePipe: DateFormatPipe = inject( DateFormatPipe )

    public ngxsOnInit (): void {
        this.facade.fetchMovementTypes()
        this.facade.fetchParticipantTypes()
    }

    @Selector()
    public static movementsPage (state: MovementStoreModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static movementsPageLoading (state: MovementStoreModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static movementsPageError (state: MovementStoreModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static movementsPageSilentLoading (state: MovementStoreModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static movementsPageResetSearch (state: MovementStoreModel): boolean {
        return state.movements.params.resetSearch
    }

    @Selector()
    public static movementsPageTypeSearchedParam (state: MovementStoreModel): string | undefined {
        return state.movements.params.typeSearched
    }

    @Selector()
    public static movementsPageVisibilitySearchedParam (state: MovementStoreModel): boolean | undefined {
        return state.movements.params.visibilitySearched
    }

    @Selector()
    public static movementsPageStartDateTimeSearchedParam (state: MovementStoreModel): string | undefined {
        return state.movements.params.startDateTimeSearched
    }

    @Selector()
    public static movementsPageEndDateTimeSearchedParam (state: MovementStoreModel): string | undefined {
        return state.movements.params.endDateTimeSearched
    }

    @Selector()
    public static movementCommunicationsPage (state: MovementStoreModel): PageModel<CommunicationModel> | undefined {
        return state.movementCommunications.element
    }

    @Selector()
    public static movementCommunicationsPageLoading (state: MovementStoreModel): boolean {
        return state.movementCommunications.loading
    }

    @Selector()
    public static movementCommunicationsPageError (state: MovementStoreModel): ToastMessageOptions | undefined {
        return state.movementCommunications.error
    }

    @Selector()
    public static movementCommunicationsPageSilentLoading (state: MovementStoreModel): boolean {
        return state.movementCommunications.silentLoading
    }

    @Selector()
    public static movementCommunicationsPageResetSearch (state: MovementStoreModel): boolean {
        return state.movementCommunications.params.resetSearch
    }

    @Selector()
    public static movementCommunicationsPageTextSearchedParam (state: MovementStoreModel): string | undefined {
        return state.movementCommunications.params.textSearched
    }

    @Selector()
    public static movementCommunicationsPageVisibilitySearchedParam (state: MovementStoreModel): boolean | undefined {
        return state.movementCommunications.params.visibilitySearched
    }

    @Selector()
    public static movementCommunicationsPageStartDateTimeSearchedParam (state: MovementStoreModel): string | undefined {
        return state.movementCommunications.params.startDateTimeSearched
    }

    @Selector()
    public static movementCommunicationsPageEndDateTimeSearchedParam (state: MovementStoreModel): string | undefined {
        return state.movementCommunications.params.endDateTimeSearched
    }

    @Selector()
    public static searchedReasonAndActivityMetadata (state: MovementStoreModel): MovementReasonModel[] {
        return state._metadata.searchedReasonsAndActivities
    }

    @Selector()
    public static searchedParticipantAndGroupMetadata (state: MovementStoreModel): SelectItemGroup<ParticipantModel | GroupModel>[] {
        return state._metadata.searchedParticipantsAndGroups
    }

    @Selector()
    public static searchedVehicleMetadata (state: MovementStoreModel): SelectItem<VehicleModel>[] {
        return state._metadata.searchedVehicles
    }

    @Selector()
    public static movementTypesMetadata (state: MovementStoreModel): SelectItem<MovementTypeEnum | undefined>[] {
        return state._metadata.types
    }

    @Selector()
    public static participantTypesMetadata (state: MovementStoreModel): SelectItem<ParticipantTypeEnum>[] {
        return state._metadata.participantTypes
    }

    @Selector()
    public static visibilitiesMetadata (state: MovementStoreModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetMovementState )
    public resetMovementState (ctx: StateContext<MovementStoreModel>): void {
        ctx.setState( {
            ...defaultMovementStore,
            _metadata: {
                ...defaultMovementStore._metadata,
                participantTypes: ctx.getState()._metadata.participantTypes,
                types: ctx.getState()._metadata.types,
            },
        } )
    }

    @Action( FetchMovementTypes )
    public fetchMovementTypes (ctx: StateContext<MovementStoreModel>): Observable<void> {
        return this.metadataApi.getMovementsTypes().pipe(
            map( (types: SelectItem<MovementTypeEnum>[]): void => this.fetchMovementTypesComplete( ctx, types ) ),
        )
    }

    private fetchMovementTypesComplete (
        ctx: StateContext<MovementStoreModel>,
        types: SelectItem<MovementTypeEnum>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                types: [
                    { label: '-', value: undefined },
                    ...types,
                ],
            },
        } )
    }

    @Action( FetchParticipantTypes )
    public fetchParticipantTypes (ctx: StateContext<MovementStoreModel>): Observable<void> {
        return this.metadataApi.getParticipantsTypes().pipe(
            map( (types: SelectItem<ParticipantTypeEnum>[]): void => this.fetchParticipantTypesComplete( ctx, types ) ),
        )
    }

    private fetchParticipantTypesComplete (
        ctx: StateContext<MovementStoreModel>,
        types: SelectItem<ParticipantTypeEnum>[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                participantTypes: types,
            },
        } )
    }

    @Action( StartMovementsPageLoader )
    public startMovementsPageLoader (ctx: StateContext<MovementStoreModel>): void {
        ctx.patchState( {
            movements: StateHelper.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopMovementsPageLoader )
    public stopMovementsPageLoader (ctx: StateContext<MovementStoreModel>): void {
        ctx.patchState( {
            movements: StateHelper.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchMovementsPage )
    public fetchMovementsPage (ctx: StateContext<MovementStoreModel>, payload: FetchMovementsPage): Observable<void> {
        return this.api.findMovements(
            payload.projectId,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().movements.params,
        ).pipe(
            initialize( (): void => this.facade.startMovementsPageLoader() ),
            finalize( (): void => this.facade.stopMovementsPageLoader() ),
            map( (movementsPage: PageModel<MovementModel>): void => this.fetchMovementsPageComplete(
                ctx,
                movementsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.pageError( ctx, error ) ),
        )
    }

    private fetchMovementsPageComplete (
        ctx: StateContext<MovementStoreModel>,
        movementsPage: PageModel<MovementModel>,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: {
                    ...ctx.getState().movements.params,
                    resetSearch: false,
                },
                element: movementsPage,
            },
        } )

        if (movementsPage.content.length > 0) {
            this.facade.fetchMovementsContents(
                movementsPage.content.map( (movement: MovementModel): string => movement.id ),
            )
        }
    }

    @Action( FetchMovementsContent )
    public fetchMovementsContent (
        ctx: StateContext<MovementStoreModel>,
        payload: FetchMovementsContent,
    ): Observable<void> {
        return this.api.findMovementsContents(
            payload.projectId,
            payload.movementIds,
            ctx.getState().movements.params.currentMovements,
        ).pipe(
            map( (contents: PairModel<MovementContentModel[]>[]): void => this.fetchMovementsContentComplete(
                ctx,
                contents,
            ) ),
        )
    }

    private fetchMovementsContentComplete (
        ctx: StateContext<MovementStoreModel>,
        contents: PairModel<MovementContentModel[]>[],
    ): void {
        if (!ctx.getState().movements.element) {
            return
        }

        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                element: {
                    ...ctx.getState().movements.element!,
                    content: MovementHelper.rebuildPageWithContent( ctx.getState().movements.element!.content, contents ),
                },
            },
        } )
    }

    @Action( UpdateMovementsPageSearchParams )
    public updateMovementsPageSearchParams (
        ctx: StateContext<MovementStoreModel>,
        payload: UpdateMovementsPageSearchParams,
    ): void {
        ctx.patchState( {
            movements: {
                ...ctx.getState().movements,
                params: payload.params,
            },
        } )
    }

    @Action( StartMovementCommunicationsPageLoader )
    public startMovementCommunicationsPageLoader (ctx: StateContext<MovementStoreModel>): void {
        ctx.patchState( {
            movementCommunications: StateHelper.updatePageLoader( ctx.getState().movementCommunications, true ),
        } )
    }

    @Action( StopMovementCommunicationsPageLoader )
    public stopMovementCommunicationsPageLoader (ctx: StateContext<MovementStoreModel>): void {
        ctx.patchState( {
            movementCommunications: StateHelper.updatePageLoader( ctx.getState().movementCommunications, false ),
        } )
    }

    @Action( FetchMovementCommunicationsPage )
    public fetchMovementCommunicationsPage (
        ctx: StateContext<MovementStoreModel>,
        payload: FetchMovementCommunicationsPage,
    ): Observable<void> {
        return this.api.findMovementCommunications(
            payload.projectId,
            payload.id,
            payload.pageNumber,
            payload.pageSize,
            ctx.getState().movementCommunications.params,
        ).pipe(
            initialize( (): void => this.facade.startMovementCommunicationsPageLoader() ),
            finalize( (): void => this.facade.stopMovementCommunicationsPageLoader() ),
            map( (communicationsPage: PageModel<CommunicationModel>): void => this.fetchMovementCommunicationsPageComplete(
                ctx,
                communicationsPage,
            ) ),
            catchError( (error: ErrorModel): Observable<void> => this.communicationsPageError( ctx, error ) ),
        )
    }

    private fetchMovementCommunicationsPageComplete (
        ctx: StateContext<MovementStoreModel>,
        communicationsPage: PageModel<CommunicationModel>,
    ): void {
        ctx.patchState( {
            movementCommunications: {
                ...ctx.getState().movementCommunications,
                params: {
                    ...ctx.getState().movementCommunications.params,
                    resetSearch: false,
                },
                element: communicationsPage,
            },
        } )
    }

    @Action( UpdateMovementCommunicationsPageSearchParams )
    public updateMovementCommunicationsPageSearchParams (
        ctx: StateContext<MovementStoreModel>,
        payload: UpdateMovementCommunicationsPageSearchParams,
    ): void {
        ctx.patchState( {
            movementCommunications: {
                ...ctx.getState().movementCommunications,
                params: payload.params,
            },
        } )
    }

    @Action( SearchReasonsAndActivities )
    public searchReasonsAndActivities (
        ctx: StateContext<MovementStoreModel>,
        payload: SearchReasonsAndActivities,
    ): Observable<void> {
        return this.api.searchReasonsAndActivities(
            payload.projectId,
            payload.textSearched,
            payload.typeSearched,
            payload.contentTypeSearched,
        ).pipe(
            map( (reasonsAndActivities: MovementReasonModel[]): void => this.searchReasonsAndActivitiesComplete(
                ctx,
                reasonsAndActivities,
            ) ),
        )
    }

    private searchReasonsAndActivitiesComplete (
        ctx: StateContext<MovementStoreModel>,
        reasonsAndActivities: MovementReasonModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedReasonsAndActivities: reasonsAndActivities,
            },
        } )
    }

    @Action( SearchParticipantsAndGroups )
    public searchParticipantsAndGroups (
        ctx: StateContext<MovementStoreModel>,
        payload: SearchParticipantsAndGroups,
    ): Observable<void> {
        return this.api.searchParticipantsAndGroups(
            payload.projectId,
            payload.contentTypeSearched,
            payload.textSearched,
        ).pipe(
            map( (participantsAndGroups: MovementParticipantsAndGroupsModel): void => this.searchParticipantsAndGroupsComplete(
                ctx,
                participantsAndGroups,
            ) ),
        )
    }

    private searchParticipantsAndGroupsComplete (
        ctx: StateContext<MovementStoreModel>,
        participantsAndGroups: MovementParticipantsAndGroupsModel,
    ): void {
        const searched: SelectItemGroup<ParticipantModel | GroupModel>[] = []

        if (participantsAndGroups.groups.length > 0) {
            searched.push( {
                label: this.translateService.instant( this.pluralTranslationPipe.transform(
                    'movements.form.content.registered.searched.group',
                    participantsAndGroups.participants,
                ) ),
                items: participantsAndGroups.groups.map( (group: GroupModel): SelectItem<GroupModel> =>
                    GroupHelper.toSelectItem( group ),
                ),
            } )
        }

        if (participantsAndGroups.participants?.length > 0) {
            searched.push( {
                label: this.translateService.instant( this.pluralTranslationPipe.transform(
                    'movements.form.content.registered.searched.participant',
                    participantsAndGroups.participants,
                ) ),
                items: participantsAndGroups.participants.map(
                    (participant: ParticipantModel): SelectItem<ParticipantModel> =>
                        ParticipantHelper.toSelectItem( participant ),
                ),
            } )
        }

        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedParticipantsAndGroups: searched,
            },
        } )
    }

    @Action( SearchVehicles )
    public searchVehicles (
        ctx: StateContext<MovementStoreModel>,
        payload: SearchVehicles,
    ): Observable<void> {
        return this.api.searchVehicles( payload.projectId, payload.textSearched ).pipe(
            map( (vehicles: VehicleModel[]): void => this.searchVehiclesComplete(
                ctx,
                vehicles,
            ) ),
        )
    }

    private searchVehiclesComplete (
        ctx: StateContext<MovementStoreModel>,
        vehicles: VehicleModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedVehicles: vehicles.map( (vehicle: VehicleModel): SelectItem<VehicleModel> =>
                    VehicleHelper.toSelectItem( vehicle ),
                ),
            },
        } )
    }

    protected refreshPage (ctx: StateContext<MovementStoreModel>): void {
        const page: PageModel<MovementModel> | undefined = ctx.getState().movements.element
        this.facade.fetchMovementsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected communicationsPageError (ctx: StateContext<MovementStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                movementCommunications: this.buildErrorMessage( ctx.getState().movementCommunications, error ),
            } )
        }

        return of()
    }

    protected pageError (ctx: StateContext<MovementStoreModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                movements: this.buildErrorMessage( ctx.getState().movements, error ),
            } )
        }

        return of()
    }
}
