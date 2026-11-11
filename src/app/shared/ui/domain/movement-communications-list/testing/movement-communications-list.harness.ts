import { ComponentHarness } from '@angular/cdk/testing';

import { DialogElementHarness } from '@shared/ui/domain/dialog-element/testing/dialog-element.harness';

/**
 * Objectif: Pilote la conversation d'un mouvement dans les tests.
 * Périmètre: Donne les messages affichés, dans l'ordre chronologique.
 * Limites: Le chargement des messages plus anciens est déclenché par la sentinelle de la conversation, que les tests simulent.
 */
export class MovementCommunicationsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-movement-communications-list';

	public readonly messages = this.locatorForAll(DialogElementHarness);
}
