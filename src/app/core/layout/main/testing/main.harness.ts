import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la coque des pages authentifiées dans les tests.
 * Périmètre: Indique la présence de la barre de navigation, du pied de page et de la page routée, et utilise le lien d'évitement.
 * Limites: Ne lit pas le contenu de la barre de navigation ni du pied de page ; leurs propres harnesses le font.
 */
export class MainHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-main';

	private readonly skipButton = this.locatorFor(byTestId('main-skip-to-content-button'));
	private readonly content = this.locatorFor(byTestId('main-page-content'));
	private readonly navbar = this.locatorForOptional('app-navbar');
	private readonly footer = this.locatorForOptional('app-footer');
	private readonly routedPage = this.locatorForOptional(`${byTestId('main-page-content')} router-outlet`);

	public async hasNavbar(): Promise<boolean> {
		return (await this.navbar()) !== null;
	}

	public async hasFooter(): Promise<boolean> {
		return (await this.footer()) !== null;
	}

	public async hostsRoutedPage(): Promise<boolean> {
		return (await this.routedPage()) !== null;
	}

	public async skipToContent(): Promise<void> {
		return (await this.skipButton()).click();
	}

	public async isContentFocused(): Promise<boolean> {
		return (await this.content()).isFocused();
	}
}
