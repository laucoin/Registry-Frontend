import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface UserElementView {
	name: string;
	initials: string;
	email: string;
}

/**
 * Objectif: Pilote le résumé d'un utilisateur dans les tests.
 * Périmètre: Lit le nom, les initiales et l'e-mail.
 * Limites: Lecture seule ; le résumé n'offre aucune action.
 */
export class UserElementHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-user-element';

	private readonly avatar = this.locatorFor(byTestId('user-element-avatar'));
	private readonly name = this.locatorFor(byTestId('user-element-name'));
	private readonly email = this.locatorFor(byTestId('user-element-email'));

	public async view(): Promise<UserElementView> {
		return {
			name: (await (await this.name()).text()).trim(),
			initials: (await (await this.avatar()).getProperty<string>('initials')) ?? '',
			email: (await (await this.email()).text()).trim(),
		};
	}
}
