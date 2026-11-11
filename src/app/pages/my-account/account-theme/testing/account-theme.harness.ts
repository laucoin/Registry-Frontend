import { AccountChoicesHarness } from '@pages/my-account/account-preference/testing/account-choices.harness';

/**
 * Objectif: Pilote la section de choix de la thème de la page de compte dans les tests.
 * Périmètre: Hérite de la lecture du cadre, du groupe de choix et de la sélection d'un choix.
 * Limites: Ne lit pas les icônes des choix.
 */
export class AccountThemeHarness extends AccountChoicesHarness {
	public static readonly hostSelector = 'app-account-theme';

	protected readonly controlTestId = 'account-theme-choices-group';
	protected readonly choiceTestId = 'account-theme-choice-radio';
}
