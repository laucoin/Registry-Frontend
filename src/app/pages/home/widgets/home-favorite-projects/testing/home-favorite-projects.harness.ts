import { ComponentHarness, ModifierKeys } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FavoriteToggleHarness } from '@shared/ui/common/favorite-toggle/testing/favorite-toggle.harness';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

export interface FavoriteCardView {
	name: string;
	initials: string;
	summary: string | undefined;
	period: string;
	link: string | null;
}

/**
 * Objectif: Pilote le widget des projets favoris de l'accueil dans les tests.
 * Périmètre: Lit le titre, le total, le chargement, l'état vide et les cartes ; ouvre une carte, avec ou sans touche de
 * modification, et retire un favori ; donne l'erreur de section.
 * Limites: Ne lit ni le statut ni la date de dernière modification des cartes.
 */
export class HomeFavoriteProjectsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-home-favorite-projects';

	private readonly heading = this.locatorFor(byTestId('home-favorite-projects-title'));
	private readonly totalText = this.locatorForOptional(byTestId('home-favorite-projects-total'));
	private readonly loadingText = this.locatorForOptional(byTestId('home-favorite-projects-loading'));
	private readonly emptyText = this.locatorForOptional(byTestId('home-favorite-projects-empty'));
	private readonly cardElements = this.locatorForAll(byTestId('home-favorite-projects-card'));
	private readonly tiles = this.locatorForAll(byTestId('home-favorite-projects-tile'));
	private readonly toggles = this.locatorForAll(FavoriteToggleHarness);

	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async total(): Promise<string | undefined> {
		return (await (await this.totalText())?.text())?.trim();
	}

	public async loadingShown(): Promise<boolean> {
		return (await this.loadingText()) !== null;
	}

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}

	public async cards(): Promise<FavoriteCardView[]> {
		const cards = await this.cardElements();
		return Promise.all(
			cards.map(async (card) => {
				const scope = `${byTestId('home-favorite-projects-card')}[data-id="${await card.getAttribute('data-id')}"]`;
				const text = async (selector: string): Promise<string | undefined> =>
					(await (await this.locatorForOptional(`${scope} ${selector}`)())?.text())
						?.replace(/\s+/g, ' ')
						.trim();
				return {
					name: (await text('[slot="title"]')) ?? '',
					initials: (await text('[slot="icon"]')) ?? '',
					summary: await text(byTestId('home-favorite-projects-summary')),
					period: (await text(byTestId('home-favorite-projects-period'))) ?? '',
					link: await (
						await this.locatorFor(`${scope} ${byTestId('home-favorite-projects-tile')}`)()
					).getProperty<string | null>('href'),
				};
			}),
		);
	}

	public async open(index: number, modifiers: ModifierKeys = {}): Promise<void> {
		return (await this.tiles())[index].click(modifiers);
	}

	public async remove(index: number): Promise<void> {
		return (await this.toggles())[index].toggle();
	}
}
