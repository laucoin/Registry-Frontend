import { ComponentHarness } from '@angular/cdk/testing';

import { PlannedMovementCardHarness } from '@shared/ui/domain/planned-movement-card/testing/planned-movement-card.harness';

/**
 * Objectif: Pilote le widget des arrivées prévues de l'accueil projet dans les tests.
 * Périmètre: Donne la carte des mouvements prévus qu'il alimente.
 * Limites: La carte a son propre harness pour les lignes, le squelette et l'erreur.
 */
export class ProjectUpcomingArrivalHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-upcoming-arrival';

	public readonly card = this.locatorFor(PlannedMovementCardHarness);
}
