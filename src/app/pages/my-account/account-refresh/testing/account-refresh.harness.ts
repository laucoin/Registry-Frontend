import { AccountChoicesHarness } from '@pages/my-account/account-preference/testing/account-choices.harness';

/**
 * Objectif: Pilote la section de choix de la fréquence de rafraîchissement de la page de compte dans les tests.
 * Périmètre: Hérite de la lecture du cadre, du groupe de choix et de la sélection d'un choix.
 * Limites: Ne lit pas les icônes des choix.
 */
export class AccountRefreshHarness extends AccountChoicesHarness {
	public static readonly hostSelector = 'app-account-refresh';

	protected readonly controlTestId = 'account-refresh-modes-group';
	protected readonly choiceTestId = 'account-refresh-mode-radio';
}
