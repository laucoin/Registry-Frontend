import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SelectElementsFieldHarness } from '@shared/ui/common/select-elements-field/testing/select-elements-field.harness';

/**
 * Objectif: Pilote le champ des membres d'un groupe dans les tests.
 * Périmètre: Lit le titre de la section et donne le champ de sélection des participants.
 * Limites: La sélection elle-même est pilotée par le harness du champ de sélection.
 */
export class GroupMembersFieldHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-group-members-field';

	private readonly heading = this.locatorFor(byTestId('group-members-field-title'));

	public readonly selection = this.locatorFor(SelectElementsFieldHarness);

	public async title(): Promise<string> {
		return (await this.heading()).text();
	}
}
