import { inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { SelectItem, SelectItemGroup } from 'primeng/api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { MovementStoreModel } from '@pages/projects/[projectId]/movements/data/model/movement-store.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { GroupHelper } from '@shared/helpers/group.helper'
import { ParticipantHelper } from '@shared/helpers/participant.helper'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { refreshOnLanguageChange } from '@shared/helpers/store/language-refresh'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import {
    contentsRequester,
    metadataFetcher,
    movementContentsFetcher,
    pageFetcher,
    paramsUpdater,
    withEmptyOption,
} from '@shared/helpers/store/paged-store.methods'
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature'
import { VehicleHelper } from '@shared/helpers/vehicle.helper'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementParticipantsAndGroupsModel } from '@shared/models/model/movement-participants-and-groups.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'

interface MovementsPageRequest {
    projectId: string | undefined
    pageNumber: number | undefined
    pageSize: number | undefined
}

interface MovementCommunicationsPageRequest extends MovementsPageRequest {
    id: string
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

type SectionLabel = (key: string, items: unknown[]) => string

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

function toSearchedSections (result: MovementParticipantsAndGroupsModel, label: SectionLabel): SelectItemGroup<ParticipantModel | GroupModel>[] {
    const sections: SelectItemGroup<ParticipantModel | GroupModel>[] = []
    if (result.groups.length > 0) {
        sections.push( {
            label: label( 'movements.form.content.registered.searched.group', result.groups ),
            items: result.groups.map( GroupHelper.toSelectItem ),
        } )
    }
    if (result.participants?.length > 0) {
        sections.push( {
            label: label( 'movements.form.content.registered.searched.participant', result.participants ),
            items: result.participants.map( ParticipantHelper.toSelectItem ),
        } )
    }
    return sections
}

/**
 * Purpose: Holds the movement state.
 * Scope: Owns the data of the movement pages and resources with their loading and error flags, and fetches them through the movement api.
 * Limits: Reached through the movement facade; it does not format data or notify the user of command results.
 */
export const MovementStore = signalStore(
    withState<MovementStoreModel>( defaultMovementStore ),
    withProfileScope<MovementStoreModel>( defaultMovementStore, (current: MovementStoreModel): Partial<MovementStoreModel> => ({
        metadata: {
            ...defaultMovementStore.metadata,
            participantTypes: current.metadata.participantTypes,
            types: current.metadata.types,
        },
    }) ),
    withMethods( (store, metadataApi = inject( MetadataApi ), movementApi = inject( MovementApi ), errors = inject( ErrorReporter )) => ({
        fetchMovementTypes: metadataFetcher<MovementStoreModel, 'types', void, SelectItem<MovementTypeEnum>[]>(
            store, 'types', () => metadataApi.getMovementsTypes(), errors, withEmptyOption,
        ),
        fetchParticipantTypes: metadataFetcher<MovementStoreModel, 'participantTypes', void, SelectItem<ParticipantTypeEnum>[]>(
            store, 'participantTypes', () => metadataApi.getParticipantsTypes(), errors,
        ),
        fetchMovementsContents: movementContentsFetcher( store, movementApi, errors ),
        updateMovementsPageSearchParams: paramsUpdater( store, 'movements' ),
        updateMovementCommunicationsPageSearchParams: paramsUpdater( store, 'movementCommunications' ),
    }) ),
    withMethods( (store, api = inject( MovementApi ), errors = inject( ErrorReporter )) => ({
        fetchMovementsPage: pageFetcher( store, 'movements', (request: MovementsPageRequest, params: MovementPageParamsModel) =>
            api.findMovements( request.projectId, request.pageNumber, request.pageSize, params ), errors, {
            after: contentsRequester( store.fetchMovementsContents ),
        } ),
        fetchMovementCommunicationsPage: pageFetcher( store, 'movementCommunications', (request: MovementCommunicationsPageRequest, params: CommunicationPageParamsModel) =>
            api.findMovementCommunications( request.projectId, request.id, request.pageNumber, request.pageSize, params ), errors ),
        searchReasonsAndActivities: metadataFetcher<MovementStoreModel, 'searchedReasonsAndActivities', SearchReasonsAndActivitiesRequest, MovementReasonModel[]>(
            store, 'searchedReasonsAndActivities', (request: SearchReasonsAndActivitiesRequest) =>
                api.searchReasonsAndActivities( request.projectId, request.textSearched, request.typeSearched, request.contentTypeSearched ), errors,
        ),
        searchVehicles: metadataFetcher<MovementStoreModel, 'searchedVehicles', SearchVehiclesRequest, VehicleModel[]>(
            store, 'searchedVehicles', (request: SearchVehiclesRequest) => api.searchVehicles( request.projectId, request.textSearched ), errors,
            (vehicles: VehicleModel[]): SelectItem<VehicleModel>[] => vehicles.map( VehicleHelper.toSelectItem ),
        ),
    }) ),
    withMethods( (store, api = inject( MovementApi ), errors = inject( ErrorReporter ), translateService = inject( TranslocoService ), plural = inject( PluralTranslationPipe )) => ({
        searchParticipantsAndGroups: metadataFetcher<MovementStoreModel, 'searchedParticipantsAndGroups', SearchParticipantsAndGroupsRequest, MovementParticipantsAndGroupsModel>(
            store, 'searchedParticipantsAndGroups', (request: SearchParticipantsAndGroupsRequest) =>
                api.searchParticipantsAndGroups( request.projectId, request.contentTypeSearched, request.textSearched ), errors,
            (result: MovementParticipantsAndGroupsModel): SelectItemGroup<ParticipantModel | GroupModel>[] =>
                toSearchedSections( result, (key: string, items: unknown[]): string => translateService.translate( plural.transform( key, items ) ) ),
        ),
    }) ),
    withHooks( {
        onInit: (store): void => refreshOnLanguageChange( store.fetchMovementTypes, store.fetchParticipantTypes ),
    } ),
)
