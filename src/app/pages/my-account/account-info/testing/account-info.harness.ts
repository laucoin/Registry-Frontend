import { ComponentHarness } from '@angular/cdk/testing';

import { GenericHelper } from '@shared/helpers/generic.helper';
import { byTestId } from '@shared/helpers/testing/harness/test-id';

export enum AccountInfoRowStateEnum {
	LOADING = 'loading',
	DATE = 'date',
	VALUE = 'value',
	EMPTY = 'empty',
}

export interface AccountInfoRowView {
	label: string;
	state: AccountInfoRowStateEnum;
	text: string;
}

const STATES: readonly AccountInfoRowStateEnum[] = Object.values(AccountInfoRowStateEnum);
const STATE_TEST_IDS: Record<AccountInfoRowStateEnum, string> = {
	[AccountInfoRowStateEnum.LOADING]: 'account-info-row-skeleton',
	[AccountInfoRowStateEnum.DATE]: 'account-info-row-date',
	[AccountInfoRowStateEnum.VALUE]: 'account-info-row-value',
	[AccountInfoRowStateEnum.EMPTY]: 'account-info-row-empty',
};

/**
 * Objectif: Pilote la section d'identité de la page de compte dans les tests.
 * Périmètre: Lit le titre, l'état occupé du tableau, l'indication et chaque ligne (libellé, état et texte affiché).
 * Limites: Ne lit pas la date relative rendue par `sgdf-relative-time`.
 */
export class AccountInfoHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-account-info';

	private readonly table = this.locatorFor(byTestId('account-info-table'));
	private readonly heading = this.locatorFor(byTestId('account-info-title'));
	private readonly hintCell = this.locatorFor(byTestId('account-info-hint'));

	public async title(): Promise<string> {
		return (await this.heading()).text();
	}

	public async busy(): Promise<string | null> {
		return (await this.table()).getAttribute('aria-busy');
	}

	public async hint(): Promise<string> {
		return (await this.hintCell()).text();
	}

	public async row(id: string): Promise<AccountInfoRowView> {
		const scope = `${byTestId('account-info-row')}[data-id="${id}"]`;
		const label = await (await this.locatorFor(`${scope} ${byTestId('account-info-row-label')}`)()).text();
		const found = await Promise.all(
			STATES.map(async (state) => ({
				state,
				element: await this.locatorForOptional(`${scope} ${byTestId(STATE_TEST_IDS[state])}`)(),
			})),
		);
		const shown = GenericHelper.require(
			found.find(({ element }) => element !== null),
			id,
		);
		return { label, state: shown.state, text: (await GenericHelper.require(shown.element, id).text()).trim() };
	}
}
