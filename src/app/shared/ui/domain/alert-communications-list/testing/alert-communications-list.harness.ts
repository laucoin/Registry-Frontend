import { ComponentHarness } from '@angular/cdk/testing';

import { DialogElementHarness } from '@shared/ui/domain/dialog-element/testing/dialog-element.harness';

/**
 * Objectif: Pilote la conversation d'une alerte dans les tests.
 * Périmètre: Donne les messages affichés, dans l'ordre chronologique.
 * Limites: Le chargement des messages plus anciens est déclenché par la sentinelle de la conversation, que les tests simulent.
 */
export class AlertCommunicationsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-alert-communications-list';

	public readonly messages = this.locatorForAll(DialogElementHarness);
}
