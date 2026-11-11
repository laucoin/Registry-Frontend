import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la page de connexion dans les tests.
 * Périmètre: Lit le titre, l'état du bouton de connexion, les liens légaux et l'affichage de la photo ; lance la
 * connexion et signale le chargement de la photo.
 * Limites: Ne lit pas les textes de présentation.
 */
export class LoginHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-login';

	private readonly heading = this.locatorFor(byTestId('login-title'));
	private readonly submitButton = this.locatorFor(byTestId('login-submit-button'));
	private readonly termsLink = this.locatorFor(byTestId('login-terms-link'));
	private readonly privacyLink = this.locatorFor(byTestId('login-privacy-link'));
	private readonly heroPhoto = this.locatorFor(byTestId('login-hero-photo'));

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async submitState(): Promise<{ loading: boolean; disabled: boolean }> {
		const button = await this.submitButton();
		return {
			loading: await button.getProperty<boolean>('loading'),
			disabled: await button.getProperty<boolean>('disabled'),
		};
	}

	public async submit(): Promise<void> {
		return (await this.submitButton()).click();
	}

	public async legalLinks(): Promise<(string | null)[]> {
		return Promise.all([
			(await this.termsLink()).getAttribute('href'),
			(await this.privacyLink()).getAttribute('href'),
		]);
	}

	public async heroPhotoShown(): Promise<boolean> {
		return !(await (await this.heroPhoto()).hasClass('opacity-0'));
	}

	public async heroPhotoLoaded(): Promise<void> {
		return (await this.heroPhoto()).dispatchEvent('load');
	}
}
