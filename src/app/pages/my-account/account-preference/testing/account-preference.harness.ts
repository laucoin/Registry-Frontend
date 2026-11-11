import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le cadre commun d'une préférence de la page de compte dans les tests.
 * Périmètre: Lit l'icône, le titre et l'indication.
 * Limites: Ne pilote pas le contrôle projeté ; le harness de la section le fait.
 */
export class AccountPreferenceHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-account-preference';

	private readonly iconElement = this.locatorFor(byTestId('account-preference-icon'));
	private readonly heading = this.locatorFor(byTestId('account-preference-title'));
	private readonly hintCell = this.locatorFor(byTestId('account-preference-hint'));

	public async icon(): Promise<string | null> {
		return (await this.iconElement()).getProperty<string | null>('name');
	}

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async hint(): Promise<string> {
		return (await (await this.hintCell()).text()).trim();
	}
}
