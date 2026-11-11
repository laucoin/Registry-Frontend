import { AccountChoicesHarness } from '@pages/my-account/account-preference/testing/account-choices.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la section de choix de la langue de la page de compte dans les tests.
 * Périmètre: Hérite de la lecture du cadre et du contrôle ; pilote le groupe de deux langues, ou la liste déroulante
 * au-delà, et lit le message affiché quand il n'y a pas de choix.
 * Limites: Ne lit pas le libellé accessible du contrôle.
 */
export class AccountLanguageHarness extends AccountChoicesHarness {
	public static readonly hostSelector = 'app-account-language';

	protected readonly controlTestId: string = 'account-language-options-group';
	protected readonly choiceTestId: string = 'account-language-option-radio';

	private readonly only = this.locatorForOptional(byTestId('account-language-only'));

	public async onlyText(): Promise<string | undefined> {
		return (await (await this.only())?.text())?.trim();
	}
}

/**
 * Objectif: Pilote la section de choix de la langue quand plus de deux langues sont proposées.
 * Périmètre: Lit et pilote la liste déroulante des langues au lieu du groupe de boutons.
 * Limites: Ne lit pas le libellé accessible de la liste.
 */
export class AccountLanguageSelectHarness extends AccountLanguageHarness {
	protected override readonly controlTestId: string = 'account-language-select';
	protected override readonly choiceTestId: string = 'account-language-option';
}
