import { inject } from '@angular/core';

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { CommunicationStoreModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-store.model';
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api';
import { AlertHelper } from '@shared/helpers/alert.helper';
import { MovementHelper } from '@shared/helpers/movement.helper';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { elementFetcher, metadataFetcher, trackElement } from '@shared/helpers/store/paged-store.methods';
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature';
import { AlertModel } from '@shared/models/model/alert.model';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { MovementModel } from '@shared/models/model/movement.model';

interface CommunicationRequest {
	projectId: string | undefined;
	id: string;
}

interface SearchRequest {
	projectId: string | undefined;
	q: string | undefined;
}

const defaultCommunication: ElementRequestInformationModel<CommunicationModel> = {
	element: undefined,
	loading: false,
	error: undefined,
};

const defaultCommunicationStore: CommunicationStoreModel = {
	sectionErrors: {},
	communication: defaultCommunication,
	metadata: {
		searchedMovements: [],
		searchedAlerts: [],
	},
};

/**
 * Purpose: Détient l'état des communications.
 * Scope: Possède les données des pages et ressources de communications avec leurs drapeaux de chargement et d'erreur, et les récupère via l'api des communications.
 * Limits: Atteint via la facade des communications ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const CommunicationStore = signalStore(
	withState<CommunicationStoreModel>(defaultCommunicationStore),
	withProfileScope<CommunicationStoreModel>(defaultCommunicationStore),
	withMethods((store, api = inject(CommunicationApi)) => ({
		fetchCommunication: elementFetcher(store, 'communication', (request: CommunicationRequest) =>
			api.findCommunicationById(request.projectId, request.id),
		),
		resetCommunication: () => patchState(store, { communication: defaultCommunication }),
	})),
	withMethods((store, api = inject(CommunicationApi), datePipe = inject(DateFormatPipe)) => ({
		searchMovements: metadataFetcher<CommunicationStoreModel, 'searchedMovements', SearchRequest, MovementModel[]>(
			store,
			'searchedMovements',
			(request) => api.searchMovements(request.projectId, request.q).pipe(trackElement(store, 'communication')),
			(movements) => movements.map((movement) => MovementHelper.toActivitySelectItem(movement, datePipe)),
		),
		searchAlerts: metadataFetcher<CommunicationStoreModel, 'searchedAlerts', SearchRequest, AlertModel[]>(
			store,
			'searchedAlerts',
			(request) => api.searchAlerts(request.projectId, request.q).pipe(trackElement(store, 'communication')),
			(alerts) => alerts.map((alert) => AlertHelper.toSelectItem(alert, datePipe)),
		),
	})),
);
