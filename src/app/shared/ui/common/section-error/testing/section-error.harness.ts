import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote l'erreur de section dans les tests.
 * Périmètre: Lit le titre et le texte de l'encadré, l'état du bouton « Réessayer » et le déclenche.
 * Limites: Ne lit pas la variante de l'encadré, fixée par le composant.
 */
export class SectionErrorHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-section-error';

	private readonly callout = this.locatorFor(byTestId('section-error-callout'));
	private readonly retryButton = this.locatorForOptional(byTestId('section-error-retry-button'));

	public async title(): Promise<string> {
		return (await this.callout()).getProperty<string>('title');
	}

	public async text(): Promise<string> {
		return (await this.callout()).text();
	}

	public async canRetry(): Promise<boolean> {
		return (await this.retryButton()) !== null;
	}

	public async retrying(): Promise<boolean | undefined> {
		return (await this.retryButton())?.getProperty<boolean>('loading');
	}

	public async retry(): Promise<void> {
		return (await this.retryButton())?.click();
	}
}
