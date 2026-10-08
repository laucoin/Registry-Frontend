import { inject } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import {TranslocoService} from '@jsverse/transloco'
import { map, Observable, pipe, skip, switchMap, tap } from 'rxjs'
import { SelectItem, SelectItemGroup } from 'primeng/api'
import { PageModel } from '@shared/models/model/page.model'
import { PairModel } from '@shared/models/model/pair.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementParticipantsAndGroupsModel } from '@shared/models/model/movement-participants-and-groups.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GroupModel } from '@shared/models/model/group.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { MovementReasonModel } from '@pages/projects/[projectId]/movements/data/model/movement-reason.model'
import { MovementStoreModel } from '@pages/projects/[projectId]/movements/data/model/movement-store.model'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { GroupHelper } from '@shared/helpers/group.helper'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { VehicleHelper } from '@shared/helpers/vehicle.helper'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { notifyOnError } from '@shared/helpers/rx.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'

interface MovementsPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface MovementCommunicationsPageRequest extends MovementsPageRequest {
    id: string
}

interface MovementsContentRequest {
    projectId: string | undefined
    movementIds: string[]
}

interface SearchReasonsAndActivitiesRequest {
    projectId: string | undefined
    textSearched: string | undefined
    typeSearched: string
    contentTypeSearched: ParticipantTypeEnum
}

interface SearchParticipantsAndGroupsRequest {
    projectId: string | undefined
    contentTypeSearched: ParticipantTypeEnum
    textSearched: string | undefined
}

interface SearchVehiclesRequest {
    projectId: string | undefined
    textSearched: string | undefined
}

const defaultMovementStore: MovementStoreModel = {
    movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
        resetSearch: false,
        currentMovements: false,
        linkedToActivity: undefined,
        visibilitySearched: undefined,
        typeSearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    movementCommunications: PageStateHelper.initial<CommunicationPageParamsModel, CommunicationModel>( {
        resetSearch: false,
        visibilitySearched: true,
        textSearched: undefined,
        startDateTimeSearched: undefined,
        endDateTimeSearched: undefined,
    } ),
    metadata: {
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

export const MovementStore = signalStore(
    withState<MovementStoreModel>( defaultMovementStore ),
    withProfileScope<MovementStoreModel>( defaultMovementStore, (current: MovementStoreModel): Partial<MovementStoreModel> => ({
        metadata: {
            ...defaultMovementStore.metadata,
            participantTypes: current.metadata.participantTypes,
            types: current.metadata.types,
        },
    }) ),
    withProps( () => ({
        api: inject( MovementApi ),
        metadataApi: inject( MetadataApi ),
        uiFacade: inject( UiFacade ),
        translateService: inject( TranslocoService ),
        pluralTranslationPipe: inject( PluralTranslationPipe ),
    }) ),
    withMethods( (store) => {
        const fetchMovementsContents = rxMethod<MovementsContentRequest>( pipe(
            switchMap( (request: MovementsContentRequest): Observable<PairModel<MovementContentModel[]>[]> =>
                store.api.findMovementsContents(
                    request.projectId,
                    request.movementIds,
                    store.movements.params.currentMovements(),
                ).pipe( notifyOnError( store.uiFacade ) ),
            ),
            tap( (contents: PairModel<MovementContentModel[]>[]): void => patchState( store, (state: MovementStoreModel) => {
                if (!state.movements.element) return state
                return {
                    movements: {
                        ...state.movements,
                        element: {
                            ...state.movements.element,
                            content: MovementHelper.rebuildPageWithContent( state.movements.element.content, contents ),
                        },
                    },
                }
            }) ),
        ) )

        return {
            fetchMovementTypes: rxMethod<void>( pipe(
                switchMap( (): Observable<SelectItem<MovementTypeEnum>[]> => store.metadataApi.getMovementsTypes().pipe(
                    notifyOnError( store.uiFacade ),
                ) ),
                tap( (types: SelectItem<MovementTypeEnum>[]): void => patchState( store, (state: MovementStoreModel) => ({
                    metadata: { ...state.metadata, types: [ { label: '-', value: undefined }, ...types ] },
                }) ) ),
            ) ),

            fetchParticipantTypes: rxMethod<void>( pipe(
                switchMap( (): Observable<SelectItem<ParticipantTypeEnum>[]> => store.metadataApi.getParticipantsTypes().pipe(
                    notifyOnError( store.uiFacade ),
                ) ),
                tap( (types: SelectItem<ParticipantTypeEnum>[]): void => patchState( store, (state: MovementStoreModel) => ({
                    metadata: { ...state.metadata, participantTypes: types },
                }) ) ),
            ) ),

            fetchMovementsPage: rxMethod<MovementsPageRequest>( pipe(
                switchMap( (request: MovementsPageRequest): Observable<{
                    request: MovementsPageRequest
                    page: PageModel<MovementModel>
                }> => store.api.findMovements(
                    request.projectId,
                    request.pageNumber,
                    request.pageSize,
                    store.movements.params(),
                ).pipe(
                    trackPage( store.uiFacade, pageSlice( store, 'movements' ) ),
                    map( (page: PageModel<MovementModel>) => ({ request, page }) ),
                ) ),
                tap( ({ request, page }): void => {
                    patchState( store, (state: MovementStoreModel) => ({
                        movements: {
                            ...state.movements,
                            params: { ...state.movements.params, resetSearch: false },
                            element: page,
                        },
                    }) )
                    if (page.content.length > 0) {
                        fetchMovementsContents( {
                            projectId: request.projectId,
                            movementIds: page.content.map( (movement: MovementModel): string => movement.id ),
                        } )
                    }
                } ),
            ) ),

            fetchMovementsContents,

            updateMovementsPageSearchParams: (params: MovementPageParamsModel): void => {
                patchState( store, (state: MovementStoreModel) => ({ movements: { ...state.movements, params: params } }) )
            },

            fetchMovementCommunicationsPage: rxMethod<MovementCommunicationsPageRequest>( pipe(
                switchMap( (request: MovementCommunicationsPageRequest): Observable<PageModel<CommunicationModel>> =>
                    store.api.findMovementCommunications(
                        request.projectId,
                        request.id,
                        request.pageNumber,
                        request.pageSize,
                        store.movementCommunications.params(),
                    ).pipe(
                        trackPage( store.uiFacade, pageSlice( store, 'movementCommunications' ) ),
                    ),
                ),
                tap( (page: PageModel<CommunicationModel>): void => patchState( store, (state: MovementStoreModel) => ({
                    movementCommunications: {
                        ...state.movementCommunications,
                        params: { ...state.movementCommunications.params, resetSearch: false },
                        element: page,
                    },
                }) ) ),
            ) ),

            updateMovementCommunicationsPageSearchParams: (params: CommunicationPageParamsModel): void => {
                patchState( store, (state: MovementStoreModel) => ({
                    movementCommunications: { ...state.movementCommunications, params: params },
                }) )
            },

            searchReasonsAndActivities: rxMethod<SearchReasonsAndActivitiesRequest>( pipe(
                switchMap( (request: SearchReasonsAndActivitiesRequest): Observable<MovementReasonModel[]> =>
                    store.api.searchReasonsAndActivities(
                        request.projectId,
                        request.textSearched,
                        request.typeSearched,
                        request.contentTypeSearched,
                    ).pipe( notifyOnError( store.uiFacade ) ),
                ),
                tap( (reasonsAndActivities: MovementReasonModel[]): void => patchState( store, (state: MovementStoreModel) => ({
                    metadata: { ...state.metadata, searchedReasonsAndActivities: reasonsAndActivities },
                }) ) ),
            ) ),

            searchParticipantsAndGroups: rxMethod<SearchParticipantsAndGroupsRequest>( pipe(
                switchMap( (request: SearchParticipantsAndGroupsRequest): Observable<MovementParticipantsAndGroupsModel> =>
                    store.api.searchParticipantsAndGroups(
                        request.projectId,
                        request.contentTypeSearched,
                        request.textSearched,
                    ).pipe( notifyOnError( store.uiFacade ) ),
                ),
                tap( (participantsAndGroups: MovementParticipantsAndGroupsModel): void => {
                    const searched: SelectItemGroup<ParticipantModel | GroupModel>[] = []

                    if (participantsAndGroups.groups.length > 0) {
                        searched.push( {
                            label: store.translateService.translate( store.pluralTranslationPipe.transform(
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
                            label: store.translateService.translate( store.pluralTranslationPipe.transform(
                                'movements.form.content.registered.searched.participant',
                                participantsAndGroups.participants,
                            ) ),
                            items: participantsAndGroups.participants.map(
                                (participant: ParticipantModel): SelectItem<ParticipantModel> =>
                                    ParticipantHelper.toSelectItem( participant ),
                            ),
                        } )
                    }

                    patchState( store, (state: MovementStoreModel) => ({
                        metadata: { ...state.metadata, searchedParticipantsAndGroups: searched },
                    }) )
                } ),
            ) ),

            searchVehicles: rxMethod<SearchVehiclesRequest>( pipe(
                switchMap( (request: SearchVehiclesRequest): Observable<VehicleModel[]> =>
                    store.api.searchVehicles( request.projectId, request.textSearched ).pipe( notifyOnError( store.uiFacade ) ),
                ),
                tap( (vehicles: VehicleModel[]): void => patchState( store, (state: MovementStoreModel) => ({
                    metadata: {
                        ...state.metadata,
                        searchedVehicles: vehicles.map( (vehicle: VehicleModel): SelectItem<VehicleModel> =>
                            VehicleHelper.toSelectItem( vehicle ),
                        ),
                    },
                }) ) ),
            ) ),
        }
    } ),
    withHooks( {
        onInit (store): void {
            store.fetchMovementTypes()
            store.fetchParticipantTypes()
            inject( TranslocoService ).langChanges$.pipe( skip( 1 ), takeUntilDestroyed() ).subscribe( (): void => {
                store.fetchMovementTypes()
                store.fetchParticipantTypes()
            } )
        },
    } ),
)
