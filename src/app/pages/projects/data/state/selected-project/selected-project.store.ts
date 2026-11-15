import { inject } from '@angular/core';

import { signalStore, withMethods, withState } from '@ngrx/signals';
import { RxMethod } from '@ngrx/signals/rxjs-interop';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { AlertApi } from '@pages/projects/[projectId]/alerts/data/state/alert.api';
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';
import { SelectedProjectStoreModel } from '@pages/projects/data/model/selected-project-store.model';
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import {
	contentsRequester,
	contentsSection,
	elementFetcher,
	movementContentsFetcher,
	MovementContentsRequest,
	pageFetcher,
	silentElementFetcher,
	StoreRef,
} from '@shared/helpers/store/paged-store.methods';
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

type CurrentMovementsKey = 'currentWithoutActivity' | 'currentWithActivity';

interface CurrentPageRequest extends CumulativePageRequest {
	projectId: string | undefined;
}

const emptyElement = <T>(): ElementRequestInformationModel<T> => ({
	element: undefined,
	loading: false,
	error: undefined,
});

const currentMovementsBlock = (hasActivity: boolean): SelectedProjectStoreModel[CurrentMovementsKey] =>
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
	participantsStatus: emptyElement(),
	vehiclesStatus: emptyElement(),
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
	birthdays: emptyElement(),
	arrivals: emptyElement(),
	departures: emptyElement(),
	currentWithoutActivity: currentMovementsBlock(false),
	currentWithActivity: currentMovementsBlock(true),
};

interface CurrentMovementsSource {
	store: StoreRef<SelectedProjectStoreModel>;
	movementApi: MovementApi;
	errors: ErrorReporter;
}

function currentMovements(
	source: CurrentMovementsSource,
	key: CurrentMovementsKey,
	fetchContents: (request: MovementContentsRequest) => void,
	silent = false,
): RxMethod<CurrentPageRequest> {
	return pageFetcher(
		source.store,
		key,
		(request: CurrentPageRequest, params) =>
			source.movementApi.findMovements(request.projectId, request.page, request.size, params),
		source.errors,
		{ merge: CumulativePageHelper.merge, after: contentsRequester(fetchContents), silent },
	);
}

/**
 * Objectif: Détient l'état du projet sélectionné.
 * Périmètre: Possède les données des pages et ressources du projet sélectionné avec leurs drapeaux de chargement et d'erreur, et les récupère via les api du projet sélectionné.
 * Limites: Atteint via la facade du projet sélectionné ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const SelectedProjectStore = signalStore(
	withState<SelectedProjectStoreModel>(defaultSelectedProjectStore),
	withProfileScope<SelectedProjectStoreModel>(defaultSelectedProjectStore),
	withMethods((store, movementApi = inject(MovementApi), participantApi = inject(ParticipantApi)) => ({
		fetchParticipantsStatus: elementFetcher(store, 'participantsStatus', (projectId: string | undefined) =>
			movementApi.findParticipantsStatus(projectId),
		),
		fetchVehiclesStatus: elementFetcher(store, 'vehiclesStatus', (projectId: string | undefined) =>
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
		refreshParticipantsStatus: silentElementFetcher(store, 'participantsStatus', (projectId: string | undefined) =>
			movementApi.findParticipantsStatus(projectId),
		),
		refreshVehiclesStatus: silentElementFetcher(store, 'vehiclesStatus', (projectId: string | undefined) =>
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
	})),
	withMethods((store, movementApi = inject(MovementApi)) => ({
		fetchCurrentMovementsWithoutActivityContents: movementContentsFetcher(store, movementApi, {
			key: 'currentWithoutActivity',
			section: contentsSection('withoutActivity'),
		}),
		fetchCurrentMovementsWithActivityContents: movementContentsFetcher(store, movementApi, {
			key: 'currentWithActivity',
			section: contentsSection('withActivity'),
		}),
	})),
	withMethods((store, movementApi = inject(MovementApi), errors = inject(ErrorReporter)) => {
		const current = { store, movementApi, errors };
		const withoutActivity = store.fetchCurrentMovementsWithoutActivityContents;
		const withActivity = store.fetchCurrentMovementsWithActivityContents;
		return {
			fetchCurrentMovementsPageWithoutActivity: currentMovements(
				current,
				'currentWithoutActivity',
				withoutActivity,
			),
			fetchCurrentMovementsPageWithActivity: currentMovements(current, 'currentWithActivity', withActivity),
			refreshCurrentMovementsPageWithoutActivity: currentMovements(
				current,
				'currentWithoutActivity',
				withoutActivity,
				true,
			),
			refreshCurrentMovementsPageWithActivity: currentMovements(
				current,
				'currentWithActivity',
				withActivity,
				true,
			),
		};
	}),
	withMethods((store, participantApi = inject(ParticipantApi), errors = inject(ErrorReporter)) => {
		const overdue = (
			key: 'overdue' | 'overdueList',
			silent = false,
		): ReturnType<typeof pageFetcher<SelectedProjectStoreModel, 'overdue' | 'overdueList', CurrentPageRequest>> =>
			pageFetcher(
				store,
				key,
				(request: CurrentPageRequest, params) =>
					participantApi.findParticipants(request.projectId, request.page, request.size, params),
				errors,
				{ merge: CumulativePageHelper.merge, silent },
			);
		return {
			fetchOverduePage: overdue('overdue'),
			refreshOverduePage: overdue('overdue', true),
			fetchOverdueListPage: overdue('overdueList'),
		};
	}),
	withMethods((store, alertApi = inject(AlertApi), errors = inject(ErrorReporter)) => {
		const alerts = (
			silent = false,
		): ReturnType<typeof pageFetcher<SelectedProjectStoreModel, 'alerts', CurrentPageRequest>> =>
			pageFetcher(
				store,
				'alerts',
				(request: CurrentPageRequest, params) =>
					alertApi.findAlerts(request.projectId, request.page, request.size, params),
				errors,
				{ silent },
			);
		return { fetchCurrentAlertsPage: alerts(), refreshCurrentAlertsPage: alerts(true) };
	}),
);
