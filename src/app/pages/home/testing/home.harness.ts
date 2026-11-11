import { ComponentHarness } from '@angular/cdk/testing';

import { HomeAttentionProjectsHarness } from '@pages/home/widgets/home-attention-projects/testing/home-attention-projects.harness';
import { HomeFavoriteProjectsHarness } from '@pages/home/widgets/home-favorite-projects/testing/home-favorite-projects.harness';
import { HomeInvitationsHarness } from '@pages/home/widgets/home-invitations/testing/home-invitations.harness';
import { HomeQuickAccessHarness } from '@pages/home/widgets/home-quick-access/testing/home-quick-access.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la page d'accueil dans les tests.
 * Périmètre: Lit le titre, suit le bouton de création d'un projet et donne le harness de chaque widget.
 * Limites: Ne lit pas la mise en page des widgets.
 */
export class HomeHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-home';

	private readonly heading = this.locatorFor(byTestId('home-title'));
	private readonly createButton = this.locatorForOptional(byTestId('home-create-button'));

	public readonly favorites = this.locatorFor(HomeFavoriteProjectsHarness);
	public readonly invitations = this.locatorFor(HomeInvitationsHarness);
	public readonly attention = this.locatorFor(HomeAttentionProjectsHarness);
	public readonly quickAccess = this.locatorFor(HomeQuickAccessHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async canCreate(): Promise<boolean> {
		return (await this.createButton()) !== null;
	}

	public async create(): Promise<void> {
		return (await this.createButton())?.click();
	}
}
