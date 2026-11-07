import { inject } from '@angular/core';

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, map, Observable, pipe, switchMap, tap } from 'rxjs';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { AlertApi } from '@pages/projects/[projectId]/alerts/data/state/alert.api';
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';
import { SelectedProjectStoreModel } from '@pages/projects/data/model/selected-project-store.model';
import { MovementHelper } from '@shared/helpers/movement.helper';
import { ignoreError, initialize } from '@shared/helpers/rx.helper';
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import {
	contentsSection,
	elementFetcher,
	MovementContentsRequest,
	pageFetcher,
	silentElementFetcher,
	StoreRef,
	trackSectionError,
} from '@shared/helpers/store/paged-store.methods';
import { PageSlice, trackPage } from '@shared/helpers/store/track-page.operator';
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model';
import { ErrorModel } from '@shared/models/model/error.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { PairModel } from '@shared/models/model/pair.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ProjectStatusModel } from '@shared/models/model/project-status.model';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';

type CurrentMovementsKey = keyof SelectedProjectStoreModel['isCurrent'];
type StatusKey = keyof SelectedProjectStoreModel['status'];
type MovementsBlock = SelectedProjectStoreModel['isCurrent'][CurrentMovementsKey];
type Ref = StoreRef<SelectedProjectStoreModel>;

interface CurrentPageRequest extends CumulativePageRequest {
	projectId: string | undefined;
}

const currentMovementsBlock = (hasActivity: boolean): MovementsBlock =>
	PageStateHelper.initial<MovementPageParamsModel, MovementModel>({
		resetSearch: false,
		isCurrent: true,
		hasActivity: hasActivity,
		isVisible: undefined,
		type: undefined,
		from: undefined,
		to: undefined,
		sort: undefined,
	});

function overdueBlock(): PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel> {
	return PageStateHelper.initial<ParticipantPageParamsModel, ParticipantModel>({
		resetSearch: false,
		isVisible: true,
		status: PresenceStatusEnum.OVERDUE,
		q: undefined,
		onSite: true,
		sort: 'endAvailability',
	});
}

const defaultSelectedProjectStore: SelectedProjectStoreModel = {
	sectionErrors: {},
	status: {
		participants: { element: undefined, loading: false, error: undefined },
		vehicles: { element: undefined, loading: false, error: undefined },
	},
	alerts: PageStateHelper.initial<AlertPageParamsModel, AlertModel>({
		resetSearch: false,
		q: undefined,
		status: AlertStatusEnum.IN_PROGRESS,
		isVisible: true,
		from: undefined,
		to: undefined,
		sort: '-criticality',
	}),
	overdue: overdueBlock(),
	overdueList: overdueBlock(),
	birthdays: { element: undefined, loading: false, error: undefined },
	arrivals: { element: undefined, loading: false, error: undefined },
	departures: { element: undefined, loading: false, error: undefined },
	isCurrent: {
		withoutActivity: currentMovementsBlock(false),
		withActivity: currentMovementsBlock(true),
	},
};

function patchStatus(store: Ref, key: StatusKey, patch: Partial<SelectedProjectStoreModel['status'][StatusKey]>): void {
	patchState(store, (state: SelectedProjectStoreModel) => ({
		status: { ...state.status, [key]: { ...state.status[key], ...patch } },
	}));
}

function patchCurrentMovements(
	store: Ref,
	key: CurrentMovementsKey,
	update: (block: MovementsBlock) => MovementsBlock,
): void {
	patchState(store, (state: SelectedProjectStoreModel) => ({
		isCurrent: { ...state.isCurrent, [key]: update(state.isCurrent[key]) },
	}));
}

function currentMovementsSlice(store: Ref, key: CurrentMovementsKey): PageSlice<MovementsBlock> {
	return {
		read: () => store.isCurrent()[key],
		write: (block) => patchCurrentMovements(store, key, () => block),
	};
}

function statusFetcher<T>(
	store: Ref,
	key: StatusKey,
	source: (projectId: string | undefined) => Observable<T>,
): RxMethod<string | undefined> {
	return rxMethod<string | undefined>(
		pipe(
			switchMap((projectId) =>
				source(projectId).pipe(
					initialize(() => patchStatus(store, key, { loading: true })),
					finalize(() => patchStatus(store, key, { loading: false })),
					catchError((error: ErrorModel) => reportStatusError(store, key, error)),
				),
			),
			tap((element) => patchStatus(store, key, { element: element as never })),
		),
	);
}

function silentStatusFetcher<T>(
	store: Ref,
	key: StatusKey,
	source: (projectId: string | undefined) => Observable<T>,
): RxMethod<string | undefined> {
	return rxMethod<string | undefined>(
		pipe(
			switchMap((projectId) => source(projectId).pipe(ignoreError())),
			tap((element) => patchStatus(store, key, { element: element as never })),
		),
	);
}

function reportStatusError(store: Ref, key: StatusKey, error: ErrorModel): Observable<never> {
	patchStatus(store, key, { error: PageStateHelper.toNotification(error) });
	return EMPTY;
}

function currentMovementsContents(
	store: Ref,
	key: CurrentMovementsKey,
	movementApi: MovementApi,
): RxMethod<MovementContentsRequest> {
	return rxMethod<MovementContentsRequest>(
		pipe(
			switchMap((request) =>
				movementApi
					.findMovementsContents(
						request.projectId,
						request.movementIds,
						store.isCurrent()[key].params.isCurrent,
					)
					.pipe(trackSectionError(store, contentsSection(key))),
			),
			tap((contents) => patchCurrentMovements(store, key, (block) => mergeContents(block, contents))),
		),
	);
}

function mergeContents(block: MovementsBlock, contents: PairModel<MovementContentModel[]>[]): MovementsBlock {
	if (!block.element) return block;
	return {
		...block,
		element: { ...block.element, content: MovementHelper.rebuildPageWithContent(block.element.content, contents) },
	};
}

function storeCurrentMovements(
	store: Ref,
	key: CurrentMovementsKey,
	fetchContents: (request: MovementContentsRequest) => void,
	request: CurrentPageRequest,
	page: PageModel<MovementModel>,
): void {
	patchCurrentMovements(store, key, (block): MovementsBlock => ({
		...block,
		element: CumulativePageHelper.merge(block.element, page, request),
	}));
	requestContents(fetchContents, request, page);
}

function currentMovementsPage(
	store: Ref,
	key: CurrentMovementsKey,
	movementApi: MovementApi,
	fetchContents: (request: MovementContentsRequest) => void,
	silent = false,
): RxMethod<CurrentPageRequest> {
	return rxMethod<CurrentPageRequest>(
		pipe(
			switchMap((request) => fetchCurrentMovements(store, key, movementApi, request, silent)),
			tap(({ request, page }) => storeCurrentMovements(store, key, fetchContents, request, page)),
		),
	);
}

function fetchCurrentMovements(
	store: Ref,
	key: CurrentMovementsKey,
	movementApi: MovementApi,
	request: CurrentPageRequest,
	silent: boolean,
): Observable<{ request: CurrentPageRequest; page: PageModel<MovementModel> }> {
	const params = store.isCurrent()[key].params;
	return movementApi.findMovements(request.projectId, request.page, request.size, params).pipe(
		silent ? ignoreError() : trackPage(currentMovementsSlice(store, key)),
		map((page) => ({ request, page })),
	);
}

function requestContents(
	fetchContents: (request: MovementContentsRequest) => void,
	request: CurrentPageRequest,
	page: PageModel<MovementModel>,
): void {
	if (page.content.length > 0) {
		fetchContents({
			projectId: request.projectId,
			movementIds: page.content.map((movement) => movement.id),
		});
	}
}

/**
 * Purpose: Détient l'état du projet sélectionné.
 * Scope: Possède les données des pages et ressources du projet sélectionné avec leurs drapeaux de chargement et d'erreur, et les récupère via l'api du projet sélectionné.
 * Limits: Atteint via la facade du projet sélectionné ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const SelectedProjectStore = signalStore(
	withState<SelectedProjectStoreModel>(defaultSelectedProjectStore),
	withProfileScope<SelectedProjectStoreModel>(defaultSelectedProjectStore),
	withMethods((store, movementApi = inject(MovementApi), participantApi = inject(ParticipantApi)) => ({
		fetchParticipantsStatus: statusFetcher<ProjectStatusModel>(store, 'participants', (projectId) =>
			movementApi.findParticipantsStatus(projectId),
		),
		fetchVehiclesStatus: statusFetcher<VehicleStatusModel>(store, 'vehicles', (projectId) =>
			movementApi.findVehiclesStatus(projectId),
		),
		fetchPlannedArrivals: elementFetcher(store, 'arrivals', (projectId: string | undefined) =>
			movementApi.findPlannedArrivals(projectId),
		),
		fetchPlannedDepartures: elementFetcher(store, 'departures', (projectId: string | undefined) =>
			movementApi.findPlannedDepartures(projectId),
		),
		fetchParticipantsBirthdays: elementFetcher(store, 'birthdays', (projectId: string | undefined) =>
			participantApi.findParticipantsBirthdays(projectId),
		),
	})),
	withMethods((store, movementApi = inject(MovementApi), participantApi = inject(ParticipantApi)) => ({
		refreshParticipantsStatus: silentStatusFetcher<ProjectStatusModel>(store, 'participants', (projectId) =>
			movementApi.findParticipantsStatus(projectId),
		),
		refreshVehiclesStatus: silentStatusFetcher<VehicleStatusModel>(store, 'vehicles', (projectId) =>
			movementApi.findVehiclesStatus(projectId),
		),
		refreshPlannedArrivals: silentElementFetcher(store, 'arrivals', (projectId: string | undefined) =>
			movementApi.findPlannedArrivals(projectId),
		),
		refreshPlannedDepartures: silentElementFetcher(store, 'departures', (projectId: string | undefined) =>
			movementApi.findPlannedDepartures(projectId),
		),
		refreshParticipantsBirthdays: silentElementFetcher(store, 'birthdays', (projectId: string | undefined) =>
			participantApi.findParticipantsBirthdays(projectId),
		),
		fetchCurrentMovementsWithoutActivityContents: currentMovementsContents(store, 'withoutActivity', movementApi),
	})),
	withMethods((store, movementApi = inject(MovementApi)) => ({
		fetchCurrentMovementsWithActivityContents: currentMovementsContents(store, 'withActivity', movementApi),
	})),
	withMethods((store, movementApi = inject(MovementApi)) => ({
		fetchCurrentMovementsPageWithoutActivity: currentMovementsPage(
			store,
			'withoutActivity',
			movementApi,
			store.fetchCurrentMovementsWithoutActivityContents,
		),
		fetchCurrentMovementsPageWithActivity: currentMovementsPage(
			store,
			'withActivity',
			movementApi,
			store.fetchCurrentMovementsWithActivityContents,
		),
		refreshCurrentMovementsPageWithoutActivity: currentMovementsPage(
			store,
			'withoutActivity',
			movementApi,
			store.fetchCurrentMovementsWithoutActivityContents,
			true,
		),
	})),
	withMethods(
		(
			store,
			movementApi = inject(MovementApi),
			participantApi = inject(ParticipantApi),
			errors = inject(ErrorReporter),
		) => ({
			refreshCurrentMovementsPageWithActivity: currentMovementsPage(
				store,
				'withActivity',
				movementApi,
				store.fetchCurrentMovementsWithActivityContents,
				true,
			),
			refreshOverduePage: pageFetcher(
				store,
				'overdue',
				(request: CurrentPageRequest, params) =>
					participantApi.findParticipants(request.projectId, request.page, request.size, params),
				errors,
				{ merge: CumulativePageHelper.merge, silent: true },
			),
		}),
	),
	withMethods(
		(
			store,
			alertApi = inject(AlertApi),
			participantApi = inject(ParticipantApi),
			errors = inject(ErrorReporter),
		) => ({
			refreshCurrentAlertsPage: pageFetcher(
				store,
				'alerts',
				(request: CurrentPageRequest, params) =>
					alertApi.findAlerts(request.projectId, request.page, request.size, params),
				errors,
				{ silent: true },
			),
			fetchOverduePage: pageFetcher(
				store,
				'overdue',
				(request: CurrentPageRequest, params) =>
					participantApi.findParticipants(request.projectId, request.page, request.size, params),
				errors,
				{ merge: CumulativePageHelper.merge },
			),
		}),
	),
	withMethods(
		(
			store,
			alertApi = inject(AlertApi),
			participantApi = inject(ParticipantApi),
			errors = inject(ErrorReporter),
		) => ({
			fetchOverdueListPage: pageFetcher(
				store,
				'overdueList',
				(request: CurrentPageRequest, params) =>
					participantApi.findParticipants(request.projectId, request.page, request.size, params),
				errors,
				{ merge: CumulativePageHelper.merge },
			),
			fetchCurrentAlertsPage: pageFetcher(
				store,
				'alerts',
				(request: CurrentPageRequest, params) =>
					alertApi.findAlerts(request.projectId, request.page, request.size, params),
				errors,
			),
		}),
	),
);
