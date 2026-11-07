import { inject } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { Observable } from 'rxjs';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { MetadataApi } from '@core/registry/state/metadata.api';
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model';
import { MovementStoreModel } from '@pages/projects/[projectId]/movements/data/model/movement-store.model';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';
import { GroupHelper } from '@shared/helpers/group.helper';
import { ParticipantHelper } from '@shared/helpers/participant.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper';
import { refreshOnLanguageChange } from '@shared/helpers/store/language-refresh';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import {
	contentsRequester,
	metadataFetcher,
	movementContentsFetcher,
	pageFetcher,
	paramsUpdater,
	withEmptyOption,
} from '@shared/helpers/store/paged-store.methods';
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature';
import { VehicleHelper } from '@shared/helpers/vehicle.helper';
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { GroupModel } from '@shared/models/model/group.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { MovementParticipantsAndGroupsModel } from '@shared/models/model/movement-participants-and-groups.model';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { SelectOptionGroupModel, SelectOptionModel } from '@shared/models/model/select-option.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

interface MovementsPageRequest extends CumulativePageRequest {
	projectId: string | undefined;
}

interface MovementCommunicationsPageRequest extends MovementsPageRequest {
	id: string;
}

interface SearchReasonsAndActivitiesRequest {
	projectId: string | undefined;
	q: string | undefined;
	type: string;
	contentType: ParticipantTypeEnum;
}

interface SearchParticipantsAndGroupsRequest {
	projectId: string | undefined;
	contentType: ParticipantTypeEnum;
	q: string | undefined;
	at: Date;
	all: boolean;
}

interface SearchVehiclesRequest {
	projectId: string | undefined;
	q: string | undefined;
}

type SectionLabel = (key: string, items: unknown[]) => string;

const defaultMovementStore: MovementStoreModel = {
	sectionErrors: {},
	movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>({
		resetSearch: false,
		isCurrent: false,
		hasActivity: undefined,
		isVisible: undefined,
		type: undefined,
		from: undefined,
		to: undefined,
		sort: undefined,
	}),
	movementCommunications: PageStateHelper.initial<CommunicationPageParamsModel, CommunicationModel>({
		resetSearch: false,
		isVisible: true,
		q: undefined,
		from: undefined,
		to: undefined,
	}),
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
};

function toSearchedSections(
	result: MovementParticipantsAndGroupsModel,
	label: SectionLabel,
): SelectOptionGroupModel<ParticipantModel | GroupModel>[] {
	const sections: SelectOptionGroupModel<ParticipantModel | GroupModel>[] = [];
	if (result.groups.length > 0) {
		sections.push({
			label: label('movements.form.content.registered.searched.group', result.groups),
			items: result.groups.map(GroupHelper.toSelectItem),
		});
	}
	if (result.participants?.length > 0) {
		sections.push({
			label: label('movements.form.content.registered.searched.participant', result.participants),
			items: result.participants.map(ParticipantHelper.toSelectItem),
		});
	}
	return sections;
}

function searchParticipantsAndGroups(
	api: MovementApi,
	request: SearchParticipantsAndGroupsRequest,
): Observable<MovementParticipantsAndGroupsModel> {
	return api.searchParticipantsAndGroups(request.projectId, request.contentType, request.q, request.at, request.all);
}

function searchedSectionsOf(
	translateService: TranslocoService,
	plural: PluralTranslationPipe,
): (result: MovementParticipantsAndGroupsModel) => SelectOptionGroupModel<ParticipantModel | GroupModel>[] {
	return (result) =>
		toSearchedSections(result, (key, items) => translateService.translate(plural.transform(key, items)));
}

/**
 * Purpose: Détient l'état des mouvements.
 * Scope: Possède les données des pages et ressources de mouvements avec leurs drapeaux de chargement et d'erreur, et les récupère via l'api des mouvements.
 * Limits: Atteint via la facade des mouvements ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const MovementStore = signalStore(
	withState<MovementStoreModel>(defaultMovementStore),
	withProfileScope<MovementStoreModel>(defaultMovementStore, (current): Partial<MovementStoreModel> => ({
		metadata: {
			...defaultMovementStore.metadata,
			participantTypes: current.metadata.participantTypes,
			types: current.metadata.types,
		},
	})),
	withMethods((store, metadataApi = inject(MetadataApi), movementApi = inject(MovementApi)) => ({
		fetchMovementTypes: metadataFetcher<MovementStoreModel, 'types', void, SelectOptionModel<MovementTypeEnum>[]>(
			store,
			'types',
			() => metadataApi.getMovementsTypes(),
			withEmptyOption,
		),
		fetchParticipantTypes: metadataFetcher<
			MovementStoreModel,
			'participantTypes',
			void,
			SelectOptionModel<ParticipantTypeEnum>[]
		>(store, 'participantTypes', () => metadataApi.getParticipantsTypes()),
		fetchMovementsContents: movementContentsFetcher(store, movementApi),
		updateMovementsPageSearchParams: paramsUpdater(store, 'movements'),
		updateMovementCommunicationsPageSearchParams: paramsUpdater(store, 'movementCommunications'),
	})),
	withMethods((store, api = inject(MovementApi), errors = inject(ErrorReporter)) => ({
		fetchMovementsPage: pageFetcher(
			store,
			'movements',
			(request: MovementsPageRequest, params) =>
				api.findMovements(request.projectId, request.page, request.size, params),
			errors,
			{
				merge: CumulativePageHelper.merge,
				after: contentsRequester(store.fetchMovementsContents),
			},
		),
		fetchMovementCommunicationsPage: pageFetcher(
			store,
			'movementCommunications',
			(request: MovementCommunicationsPageRequest, params) =>
				api.findMovementCommunications(request.projectId, request.id, request.page, request.size, params),
			errors,
			{ merge: CumulativePageHelper.merge },
		),
	})),
	withMethods((store, api = inject(MovementApi)) => ({
		searchReasonsAndActivities: metadataFetcher<
			MovementStoreModel,
			'searchedReasonsAndActivities',
			SearchReasonsAndActivitiesRequest,
			MovementReasonModel[]
		>(store, 'searchedReasonsAndActivities', (request) =>
			api.searchReasonsAndActivities(request.projectId, request.q, request.type, request.contentType),
		),
		searchVehicles: metadataFetcher<MovementStoreModel, 'searchedVehicles', SearchVehiclesRequest, VehicleModel[]>(
			store,
			'searchedVehicles',
			(request) => api.searchVehicles(request.projectId, request.q),
			(vehicles) => vehicles.map(VehicleHelper.toSelectItem),
		),
	})),
	withMethods(
		(
			store,
			api = inject(MovementApi),
			translateService = inject(TranslocoService),
			plural = inject(PluralTranslationPipe),
		) => ({
			searchParticipantsAndGroups: metadataFetcher<
				MovementStoreModel,
				'searchedParticipantsAndGroups',
				SearchParticipantsAndGroupsRequest,
				MovementParticipantsAndGroupsModel
			>(
				store,
				'searchedParticipantsAndGroups',
				(request) => searchParticipantsAndGroups(api, request),
				searchedSectionsOf(translateService, plural),
			),
		}),
	),
	withHooks({
		onInit: (store) => refreshOnLanguageChange(store.fetchMovementTypes, store.fetchParticipantTypes),
	}),
);
