import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { ElementActionsHarness } from '@shared/ui/common/element-actions/testing/element-actions.harness';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

export interface UserRowView {
	name: string;
	email: string;
	lastLogin: string;
	role: string | undefined;
	hidden: boolean;
	disabled: boolean;
}

/**
 * Objectif: Pilote la page de la liste des utilisateurs dans les tests.
 * Périmètre: Donne la liste partagée, lit le titre, saisit et lit le texte recherché, lit les lignes et donne le menu
 * d'actions d'une ligne.
 * Limites: Ne pilote ni le filtre de visibilité ni le tri.
 */
export class UsersListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-users-list';

	private readonly heading = this.locatorFor(byTestId('users-list-title'));
	private readonly query = this.locatorFor(byTestId('users-list-q-input'));
	private readonly rowElements = this.locatorForAll(byTestId('user-row'));

	public readonly list = this.locatorFor(ListHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async searchedText(): Promise<string> {
		return (await this.query()).getProperty<string>('value');
	}

	public async search(text: string): Promise<void> {
		const input = await this.query();
		await typeInto(input, text);
		await input.dispatchEvent('focusout');
	}

	public async rows(): Promise<UserRowView[]> {
		const rows = await this.rowElements();
		return Promise.all(rows.map(async (row) => this.rowView(await row.getAttribute('data-id'))));
	}

	public async actions(id: string): Promise<ElementActionsHarness> {
		return this.locatorFor(
			new HarnessPredicate(ElementActionsHarness, { ancestor: `${byTestId('user-row')}[data-id="${id}"]` }),
		)();
	}

	private async rowView(id: string | null): Promise<UserRowView> {
		const scope = `${byTestId('user-row')}[data-id="${id}"]`;
		const text = async (testId: string): Promise<string | undefined> =>
			(await (await this.locatorForOptional(`${scope} ${byTestId(testId)}`)())?.text())
				?.replace(/\s+/g, ' ')
				.trim();
		return {
			name: (await text('user-row-name')) ?? '',
			email: (await text('user-row-email')) ?? '',
			lastLogin: (await text('user-row-last-login')) ?? (await text('user-row-never-logged')) ?? '',
			role: await text('user-row-role'),
			hidden: (await text('user-row-hidden-tag')) !== undefined,
			disabled: await (await this.locatorFor(scope)()).getProperty<boolean>('disabled'),
		};
	}
}
