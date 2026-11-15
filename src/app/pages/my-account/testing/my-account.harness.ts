import { ComponentHarness } from '@angular/cdk/testing';

import { AccountInfoHarness } from '@pages/my-account/account-info/testing/account-info.harness';
import { AccountLanguageHarness } from '@pages/my-account/account-language/testing/account-language.harness';
import { AccountPersonalDataHarness } from '@pages/my-account/account-personal-data/testing/account-personal-data.harness';
import { AccountRefreshHarness } from '@pages/my-account/account-refresh/testing/account-refresh.harness';
import { AccountThemeHarness } from '@pages/my-account/account-theme/testing/account-theme.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la page de compte dans les tests.
 * Périmètre: Lit le titre et donne le harness de chaque section.
 * Limites: Ne lit pas la mise en page des sections.
 */
export class MyAccountHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-my-account';

	private readonly heading = this.locatorFor(byTestId('my-account-title'));

	public readonly info = this.locatorFor(AccountInfoHarness);
	public readonly language = this.locatorFor(AccountLanguageHarness);
	public readonly theme = this.locatorFor(AccountThemeHarness);
	public readonly refresh = this.locatorFor(AccountRefreshHarness);
	public readonly personalData = this.locatorFor(AccountPersonalDataHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}
}
