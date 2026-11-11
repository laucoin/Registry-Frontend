import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId, typeInto } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote la page des invitations de l'utilisateur dans les tests.
 * Périmètre: Donne la liste partagée, lit et saisit le texte recherché, et suit les actions de l'état vide.
 * Limites: Ne pilote ni la date de recherche ni le tri, ni les lignes de profil (harnesses de leurs composants).
 */
export class InvitationsListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-invitations-list';

	private readonly query = this.locatorFor(byTestId('invitations-list-q-input'));
	private readonly emptyCallout = this.locatorForOptional(byTestId('invitations-list-empty-callout'));
	private readonly createButton = this.locatorFor(byTestId('invitations-list-create-project-button'));
	private readonly projectsButton = this.locatorFor(byTestId('invitations-list-projects-button'));

	public readonly list = this.locatorFor(ListHarness);

	public async searchedText(): Promise<string> {
		return (await this.query()).getProperty<string>('value');
	}

	public async search(text: string): Promise<void> {
		const input = await this.query();
		await typeInto(input, text);
		await input.dispatchEvent('focusout');
	}

	public async emptyShown(): Promise<boolean> {
		return (await this.emptyCallout()) !== null;
	}

	public async createProject(): Promise<void> {
		return (await this.createButton()).click();
	}

	public async openProjects(): Promise<void> {
		return (await this.projectsButton()).click();
	}
}
