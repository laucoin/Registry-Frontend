import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SelectElementsFieldHarness } from '@shared/ui/common/select-elements-field/testing/select-elements-field.harness';

/**
 * Objectif: Pilote la sélection des participants inscrits d'un mouvement dans les tests.
 * Périmètre: Lit le titre, signale le changement de l'interrupteur « tout le projet » et donne le champ de sélection.
 * Limites: Ne coche pas l'interrupteur, que les tests ne peuvent pas basculer par un clic ; le harness du champ de
 * sélection pilote la recherche et la sélection.
 */
export class RegisteredParticipantsFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-registered-participants-fields';

	private readonly heading = this.locatorFor('h2');
	private readonly allSwitch = this.locatorFor(byTestId('registered-participants-fields-all-switch'));

	public readonly field = this.locatorFor(SelectElementsFieldHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async widen(): Promise<void> {
		return (await this.allSwitch()).dispatchEvent('change');
	}
}
