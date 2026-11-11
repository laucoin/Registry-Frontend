import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export interface QuickAccessView {
	label: string;
	external: boolean;
	href: string | null;
	target: string | null;
}

/**
 * Objectif: Pilote le widget d'accès rapide de l'accueil dans les tests.
 * Périmètre: Lit le titre et les raccourcis (libellé, lien interne ou externe, cible) et suit un raccourci interne.
 * Limites: Ne lit pas les icônes.
 */
export class HomeQuickAccessHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-home-quick-access';

	private readonly heading = this.locatorFor(byTestId('home-quick-access-title'));
	private readonly buttons = this.locatorForAll(
		byTestId('home-quick-access-internal-button'),
		byTestId('home-quick-access-external-button'),
	);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async shortcuts(): Promise<QuickAccessView[]> {
		return Promise.all((await this.buttons()).map((button) => this.viewOf(button)));
	}

	public async follow(label: string): Promise<void> {
		return (
			await this.locatorFor(`${byTestId('home-quick-access-internal-button')}[data-id="${label}"]`)()
		).click();
	}

	private async viewOf(button: TestElement): Promise<QuickAccessView> {
		return {
			label: (await button.getAttribute('data-id')) ?? '',
			external: (await button.getAttribute('data-test-id')) === 'home-quick-access-external-button',
			href: await button.getProperty<string | null>('href'),
			target: await button.getProperty<string | null>('target'),
		};
	}
}
