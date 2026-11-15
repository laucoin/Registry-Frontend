import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote l'erreur pleine page dans les tests.
 * Périmètre: Lit le titre, le texte et la variante de l'encadré d'erreur et déclenche le nouvel essai.
 * Limites: Ne lit pas le titre de page ; seul l'encadré porte l'erreur.
 */
export class GlobalErrorHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-global-error';

	private readonly callout = this.locatorFor(byTestId('global-error-callout'));
	private readonly retryButton = this.locatorFor(byTestId('global-error-retry-button'));

	public async title(): Promise<string> {
		return (await this.callout()).getProperty<string>('title');
	}

	public async text(): Promise<string> {
		return (await this.callout()).text();
	}

	public async variant(): Promise<string | null> {
		return (await this.callout()).getAttribute('variant');
	}

	public async retry(): Promise<void> {
		return (await this.retryButton()).click();
	}
}
