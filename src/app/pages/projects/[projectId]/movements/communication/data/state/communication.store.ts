import { inject } from '@angular/core';

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { CommunicationStoreModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-store.model';
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api';
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
 * Objectif: Détient l'état des communications.
 * Périmètre: Possède les données des pages et ressources de communications avec leurs drapeaux de chargement et d'erreur, et les récupère via l'api des communications.
 * Limites: Atteint via la facade des communications ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
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
	withMethods((store, api = inject(CommunicationApi)) => ({
		searchMovements: metadataFetcher<CommunicationStoreModel, 'searchedMovements', SearchRequest, MovementModel[]>(
			store,
			'searchedMovements',
			(request) => api.searchMovements(request.projectId, request.q).pipe(trackElement(store, 'communication')),
		),
		searchAlerts: metadataFetcher<CommunicationStoreModel, 'searchedAlerts', SearchRequest, AlertModel[]>(
			store,
			'searchedAlerts',
			(request) => api.searchAlerts(request.projectId, request.q).pipe(trackElement(store, 'communication')),
		),
	})),
);
