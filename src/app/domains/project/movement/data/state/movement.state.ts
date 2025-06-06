import { Action, NgxsOnInit, Selector, State, StateContext } from '@ngxs/store'
import { catchError, finalize, map, Observable, of } from 'rxjs'
import { PageModel } from '../../../../../shared/util-model/model/page.model'
import { GenericProjectElementState } from '../../../../../shared/util-tool/state/generic-project-element.state'
import { initialize } from '../../../../../shared/util-tool/util/rx.util'
import {
    CreateGuestsMovement,
    CreateMovement,
    DeleteMovement,
    DisableMovement,
    EnableMovement,
    FetchMovement,
    FetchMovementCommunicationsPage,
    FetchMovementsContent,
    FetchMovementsPage,
    FetchMovementTypes,
    FetchParticipantTypes,
    ResetMovement,
    ResetMovementState,
    SearchParticipantsAndGroups,
    SearchReasonsAndActivities,
    SearchVehicles,
    StartMovementCommunicationsPageLoader,
    StartMovementLoader,
    StartMovementsPageLoader,
    StopMovementCommunicationsPageLoader,
    StopMovementLoader,
    StopMovementsPageLoader,
    UpdateGuestsMovement,
    UpdateMovement,
    UpdateMovementCommunicationsPageSearchParams,
    UpdateMovementsPageSearchParams,
} from './movement.action'
import { MovementService } from './movement.service'
import { MovementFacade } from './movement.facade'
import { StateUtil } from '../../../../../shared/util-tool/state/state.util'
import { Injectable } from '@angular/core'
import {
    ElementRequestInformationModel,
} from '../../../../../shared/util-model/model/element-request-information.model'
import { GroupModel } from '../../../../../shared/util-model/model/group.model'
import { GroupUtil } from '../../../../../shared/util-tool/util/group.util'
import { SelectItem, SelectItemGroup, ToastMessageOptions } from 'primeng/api'
import { ErrorModel } from '../../../../../shared/util-model/model/error.model'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { MovementModel } from '../../../../../shared/util-model/model/movement.model'
import { MovementStateModel } from '../model/movement-state.model'
import {
    MovementParticipantsAndGroupsModel,
} from '../../../../../shared/util-model/model/movement-participants-and-groups.model'
import { ParticipantUtil } from '../../../../../shared/util-tool/util/participant.util'
import { VehicleModel } from '../../../../../shared/util-model/model/vehicle.model'
import { VehicleUtil } from '../../../../../shared/util-tool/util/vehicle.util'
import { MovementContentModel } from '../../../../../shared/util-model/model/movement-content.model'
import { PairModel } from '../../../../../shared/util-model/model/pair.model'
import { MovementUtil } from '../../../../../shared/util-tool/util/movement.util'
import { DateFormatPipe } from '../../../../../shared/util-tool/pipe/date-format.pipe'
import { PluralTranslationPipe } from '../../../../../shared/util-tool/pipe/plural-translation.pipe'
import { MetadataService } from '../../../../../shared/util-common/state/metadata.service'
import { MovementReasonModel } from '../model/movement-reason.model'
import { MovementTypeEnum } from '../../../../../shared/util-model/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '../../../../../shared/util-model/enumeration/participant-type.enum'
import { SeverityEnum } from '../../../../../shared/util-model/enumeration/severity.enum'
import { CommunicationModel } from '../../../communication/data/model/communication.model'

const defaultMovement: ElementRequestInformationModel<MovementModel> = {
    element: undefined,
    loading: false,
}

const defaultMovementState: MovementStateModel = {
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
    movement: defaultMovement,
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

@State<MovementStateModel>( {
    name: 'movement',
    defaults: defaultMovementState,
} )
@Injectable()
export class MovementState extends GenericProjectElementState<MovementStateModel> implements NgxsOnInit {
    private readonly movementIcon: string = 'pi pi-sort-alt'

    public constructor (
        private readonly service: MovementService,
        private readonly metadataService: MetadataService,
        private readonly facade: MovementFacade,
        private readonly pluralTranslationPipe: PluralTranslationPipe,
        private readonly datePipe: DateFormatPipe,
    ) {
        super()
    }

    public ngxsOnInit (): void {
        this.facade.fetchMovementTypes()
        this.facade.fetchParticipantTypes()
    }

    @Selector()
    public static movementsPage (state: MovementStateModel): PageModel<MovementModel> | undefined {
        return state.movements.element
    }

    @Selector()
    public static movementsPageLoading (state: MovementStateModel): boolean {
        return state.movements.loading
    }

    @Selector()
    public static movementsPageError (state: MovementStateModel): ToastMessageOptions | undefined {
        return state.movements.error
    }

    @Selector()
    public static movementsPageSilentLoading (state: MovementStateModel): boolean {
        return state.movements.silentLoading
    }

    @Selector()
    public static movementsPageResetSearch (state: MovementStateModel): boolean {
        return state.movements.params.resetSearch
    }

    @Selector()
    public static movementsPageTypeSearchedParam (state: MovementStateModel): string | undefined {
        return state.movements.params.typeSearched
    }

    @Selector()
    public static movementsPageVisibilitySearchedParam (state: MovementStateModel): boolean | undefined {
        return state.movements.params.visibilitySearched
    }

    @Selector()
    public static movementsPageStartDateTimeSearchedParam (state: MovementStateModel): string | undefined {
        return state.movements.params.startDateTimeSearched
    }

    @Selector()
    public static movementsPageEndDateTimeSearchedParam (state: MovementStateModel): string | undefined {
        return state.movements.params.endDateTimeSearched
    }

    @Selector()
    public static movementCommunicationsPage (state: MovementStateModel): PageModel<CommunicationModel> | undefined {
        return state.movementCommunications.element
    }

    @Selector()
    public static movementCommunicationsPageLoading (state: MovementStateModel): boolean {
        return state.movementCommunications.loading
    }

    @Selector()
    public static movementCommunicationsPageError (state: MovementStateModel): ToastMessageOptions | undefined {
        return state.movementCommunications.error
    }

    @Selector()
    public static movementCommunicationsPageSilentLoading (state: MovementStateModel): boolean {
        return state.movementCommunications.silentLoading
    }

    @Selector()
    public static movementCommunicationsPageResetSearch (state: MovementStateModel): boolean {
        return state.movementCommunications.params.resetSearch
    }

    @Selector()
    public static movementCommunicationsPageTextSearchedParam (state: MovementStateModel): string | undefined {
        return state.movementCommunications.params.textSearched
    }

    @Selector()
    public static movementCommunicationsPageVisibilitySearchedParam (state: MovementStateModel): boolean | undefined {
        return state.movementCommunications.params.visibilitySearched
    }

    @Selector()
    public static movementCommunicationsPageStartDateTimeSearchedParam (state: MovementStateModel): string | undefined {
        return state.movementCommunications.params.startDateTimeSearched
    }

    @Selector()
    public static movementCommunicationsPageEndDateTimeSearchedParam (state: MovementStateModel): string | undefined {
        return state.movementCommunications.params.endDateTimeSearched
    }

    @Selector()
    public static movement (state: MovementStateModel): MovementModel | undefined {
        return state.movement.element
    }

    @Selector()
    public static movementLoading (state: MovementStateModel): boolean {
        return state.movement.loading
    }

    @Selector()
    public static searchedReasonAndActivityMetadata (state: MovementStateModel): MovementReasonModel[] {
        return state._metadata.searchedReasonsAndActivities
    }

    @Selector()
    public static searchedParticipantAndGroupMetadata (state: MovementStateModel): SelectItemGroup<ParticipantModel | GroupModel>[] {
        return state._metadata.searchedParticipantsAndGroups
    }

    @Selector()
    public static searchedVehicleMetadata (state: MovementStateModel): SelectItem<VehicleModel>[] {
        return state._metadata.searchedVehicles
    }

    @Selector()
    public static movementTypesMetadata (state: MovementStateModel): SelectItem<MovementTypeEnum | undefined>[] {
        return state._metadata.types
    }

    @Selector()
    public static participantTypesMetadata (state: MovementStateModel): SelectItem<ParticipantTypeEnum>[] {
        return state._metadata.participantTypes
    }

    @Selector()
    public static visibilitiesMetadata (state: MovementStateModel): SelectItem<boolean | undefined>[] {
        return state._metadata.visibilities
    }

    @Action( ResetMovementState )
    public resetMovementState (ctx: StateContext<MovementStateModel>): void {
        ctx.setState( {
            ...defaultMovementState,
            _metadata: {
                ...defaultMovementState._metadata,
                participantTypes: ctx.getState()._metadata.participantTypes,
                types: ctx.getState()._metadata.types,
            },
        } )
    }

    @Action( FetchMovementTypes )
    public fetchMovementTypes (ctx: StateContext<MovementStateModel>): Observable<void> {
        return this.metadataService.getMovementsTypes().pipe(
            map( (types: SelectItem<MovementTypeEnum>[]): void => this.fetchMovementTypesComplete( ctx, types ) ),
        )
    }

    private fetchMovementTypesComplete (
        ctx: StateContext<MovementStateModel>,
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
    public fetchParticipantTypes (ctx: StateContext<MovementStateModel>): Observable<void> {
        return this.metadataService.getParticipantsTypes().pipe(
            map( (types: SelectItem<ParticipantTypeEnum>[]): void => this.fetchParticipantTypesComplete( ctx, types ) ),
        )
    }

    private fetchParticipantTypesComplete (
        ctx: StateContext<MovementStateModel>,
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
    public startMovementsPageLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, true ),
        } )
    }

    @Action( StopMovementsPageLoader )
    public stopMovementsPageLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movements: StateUtil.updatePageLoader( ctx.getState().movements, false ),
        } )
    }

    @Action( FetchMovementsPage )
    public fetchMovementsPage (ctx: StateContext<MovementStateModel>, payload: FetchMovementsPage): Observable<void> {
        return this.service.findMovements(
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
        ctx: StateContext<MovementStateModel>,
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
        ctx: StateContext<MovementStateModel>,
        payload: FetchMovementsContent,
    ): Observable<void> {
        return this.service.findMovementsContents(
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
        ctx: StateContext<MovementStateModel>,
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
                    content: MovementUtil.rebuildPageWithContent( ctx.getState().movements.element!.content, contents ),
                },
            },
        } )
    }

    @Action( UpdateMovementsPageSearchParams )
    public updateMovementsPageSearchParams (
        ctx: StateContext<MovementStateModel>,
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
    public startMovementCommunicationsPageLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movementCommunications: StateUtil.updatePageLoader( ctx.getState().movementCommunications, true ),
        } )
    }

    @Action( StopMovementCommunicationsPageLoader )
    public stopMovementCommunicationsPageLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movementCommunications: StateUtil.updatePageLoader( ctx.getState().movementCommunications, false ),
        } )
    }

    @Action( FetchMovementCommunicationsPage )
    public fetchMovementCommunicationsPage (
        ctx: StateContext<MovementStateModel>,
        payload: FetchMovementCommunicationsPage,
    ): Observable<void> {
        return this.service.findMovementCommunications(
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
        ctx: StateContext<MovementStateModel>,
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
        ctx: StateContext<MovementStateModel>,
        payload: UpdateMovementCommunicationsPageSearchParams,
    ): void {
        ctx.patchState( {
            movementCommunications: {
                ...ctx.getState().movementCommunications,
                params: payload.params,
            },
        } )
    }

    @Action( StartMovementLoader )
    public startMovementLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movement: StateUtil.updateElementLoader( ctx.getState().movement, true ),
        } )
    }

    @Action( StopMovementLoader )
    public stopMovementLoader (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movement: StateUtil.updateElementLoader( ctx.getState().movement, false ),
        } )
    }

    @Action( FetchMovement )
    public fetchMovement (ctx: StateContext<MovementStateModel>, payload: FetchMovement): Observable<void> {
        return this.service.findMovementById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.fetchMovementComplete( ctx, movement ) ),
        )
    }

    private fetchMovementComplete (ctx: StateContext<MovementStateModel>, movement: MovementModel): void {
        ctx.patchState( {
            movement: {
                ...ctx.getState().movement,
                element: movement,
            },
        } )
    }

    @Action( SearchReasonsAndActivities )
    public searchReasonsAndActivities (
        ctx: StateContext<MovementStateModel>,
        payload: SearchReasonsAndActivities,
    ): Observable<void> {
        return this.service.searchReasonsAndActivities(
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
        ctx: StateContext<MovementStateModel>,
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
        ctx: StateContext<MovementStateModel>,
        payload: SearchParticipantsAndGroups,
    ): Observable<void> {
        return this.service.searchParticipantsAndGroups(
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
        ctx: StateContext<MovementStateModel>,
        participantsAndGroups: MovementParticipantsAndGroupsModel,
    ): void {
        const searched: SelectItemGroup<ParticipantModel | GroupModel>[] = []

        if (participantsAndGroups.participants?.length > 0) {
            searched.push( {
                label: this.translateService.instant( this.pluralTranslationPipe.transform(
                    'movements.form.content.registered.searched.participant',
                    participantsAndGroups.participants,
                ) ),
                items: participantsAndGroups.participants.map(
                    (participant: ParticipantModel): SelectItem<ParticipantModel> =>
                        ParticipantUtil.toSelectItem( participant ),
                ),
            } )
        }

        if (participantsAndGroups.groups.length > 0) {
            searched.push( {
                label: this.translateService.instant( this.pluralTranslationPipe.transform(
                    'movements.form.content.registered.searched.group',
                    participantsAndGroups.participants,
                ) ),
                items: participantsAndGroups.groups.map( (group: GroupModel): SelectItem<GroupModel> =>
                    GroupUtil.toSelectItem( group ),
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
        ctx: StateContext<MovementStateModel>,
        payload: SearchVehicles,
    ): Observable<void> {
        return this.service.searchVehicles( payload.projectId, payload.textSearched ).pipe(
            map( (vehicles: VehicleModel[]): void => this.searchVehiclesComplete(
                ctx,
                vehicles,
            ) ),
        )
    }

    private searchVehiclesComplete (
        ctx: StateContext<MovementStateModel>,
        vehicles: VehicleModel[],
    ): void {
        ctx.patchState( {
            _metadata: {
                ...ctx.getState()._metadata,
                searchedVehicles: vehicles.map( (vehicle: VehicleModel): SelectItem<VehicleModel> =>
                    VehicleUtil.toSelectItem( vehicle ),
                ),
            },
        } )
    }

    @Action( ResetMovement )
    public resetMovement (ctx: StateContext<MovementStateModel>): void {
        ctx.patchState( {
            movement: defaultMovement,
        } )
    }

    @Action( CreateMovement )
    public createMovement (ctx: StateContext<MovementStateModel>, payload: CreateMovement): Observable<void> {
        return this.service.createMovement( payload.projectId, payload.movement ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.createMovementComplete( ctx, movement ) ),
        )
    }

    @Action( CreateGuestsMovement )
    public createGuestsMovement (
        ctx: StateContext<MovementStateModel>,
        payload: CreateGuestsMovement,
    ): Observable<void> {
        return this.service.createGuestsMovement( payload.projectId, payload.movement ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.createMovementComplete( ctx, movement ) ),
        )
    }

    private createMovementComplete (
        ctx: StateContext<MovementStateModel>,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `movements.notifications.create.${movement.type.value}.title`,
            this.pluralTranslationPipe.transform(
                `movements.notifications.create.${movement.type.value}.message`,
                movement.content,
            ),
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx )
    }

    @Action( UpdateMovement )
    public updateMovement (ctx: StateContext<MovementStateModel>, payload: UpdateMovement): Observable<void> {
        return this.service.updateMovementById( payload.projectId, payload.id, payload.movement ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.updateMovementComplete( ctx, movement ) ),
        )
    }

    @Action( UpdateGuestsMovement )
    public updateGuestsMovement (
        ctx: StateContext<MovementStateModel>,
        payload: UpdateGuestsMovement,
    ): Observable<void> {
        return this.service.updateGuestsMovementById( payload.projectId, payload.id, payload.movement ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.updateMovementComplete( ctx, movement ) ),
        )
    }

    private updateMovementComplete (
        ctx: StateContext<MovementStateModel>,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `movements.notifications.edit.${movement.type.value}.title`,
            `movements.notifications.edit.${movement.type.value}.message`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx )
    }

    @Action( DisableMovement )
    public disableMovement (ctx: StateContext<MovementStateModel>, payload: DisableMovement): Observable<void> {
        return this.service.disableMovementById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.disableMovementComplete( ctx, movement ) ),
        )
    }

    private disableMovementComplete (
        ctx: StateContext<MovementStateModel>,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `movements.notifications.disable.${movement.type.value}.title`,
            `movements.notifications.disable.${movement.type.value}.message`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx )
    }

    @Action( EnableMovement )
    public enableMovement (ctx: StateContext<MovementStateModel>, payload: EnableMovement): Observable<void> {
        return this.service.enableMovementById( payload.projectId, payload.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (movement: MovementModel): void => this.enableMovementComplete( ctx, movement ) ),
        )
    }

    private enableMovementComplete (
        ctx: StateContext<MovementStateModel>,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `movements.notifications.enable.${movement.type.value}.title`,
            `movements.notifications.enable.${movement.type.value}.message`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx )
    }

    @Action( DeleteMovement )
    public deleteMovement (ctx: StateContext<MovementStateModel>, payload: DeleteMovement): Observable<void> {
        return this.service.deleteMovementById( undefined, payload.movement.id ).pipe(
            initialize( (): void => this.facade.startMovementLoader() ),
            finalize( (): void => this.facade.stopMovementLoader() ),
            map( (): void => this.deleteMovementComplete( ctx, payload.movement ) ),
        )
    }

    private deleteMovementComplete (
        ctx: StateContext<MovementStateModel>,
        movement: MovementModel,
    ): void {
        this.buildMessageAndNotify(
            SeverityEnum.SUCCESS,
            `movements.notifications.delete.${movement.type.value}.title`,
            `movements.notifications.delete.${movement.type.value}.message`,
            this.movementIcon,
            this.buildTranslationArgs( movement ),
        )
        this.refreshPage( ctx )
    }

    private buildTranslationArgs (movement: MovementModel): object {
        return {
            datetime: this.datePipe.transform( movement?.dateTime, 'datetime' ),
            participants: movement.content?.length ?? 0,
        }
    }

    protected refreshPage (ctx: StateContext<MovementStateModel>): void {
        const page: PageModel<MovementModel> | undefined = ctx.getState().movements.element
        this.facade.fetchMovementsPage( page?.pageNumber, page?.pageSize, true )
    }

    protected communicationsPageError (ctx: StateContext<MovementStateModel>, error: ErrorModel): Observable<void> {
        if (error.status == 503) {
            throw error
        } else {
            ctx.patchState( {
                movementCommunications: this.buildErrorMessage( ctx.getState().movementCommunications, error ),
            } )
        }

        return of()
    }

    protected pageError (ctx: StateContext<MovementStateModel>, error: ErrorModel): Observable<void> {
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
