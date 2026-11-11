import { signal } from '@angular/core';

import { NEVER, Observable } from 'rxjs';
import { vi } from 'vitest';

/**
 * Substitut de la facade des communications dans les specs des éléments qui ouvrent le formulaire de communication :
 * aucune communication chargée, aucune recherche aboutie et aucun rechargement émis.
 */
export function communicationFacadeStub(): object {
	return {
		communication: signal(undefined),
		communication$: NEVER,
		communicationError: signal(undefined),
		communicationLoading: signal(false),
		metadataErrors: signal({}),
		searchedMovementsMetadata: signal([]),
		searchedAlertsMetadata: signal([]),
		handleCommunicationFirstPageReload: (): Observable<never> => NEVER,
		handleCommunicationCurrentPageReload: (): Observable<never> => NEVER,
		resetCommunication: vi.fn(),
		fetchCommunication: vi.fn(),
		searchMovements: vi.fn(),
		searchAlerts: vi.fn(),
	};
}
