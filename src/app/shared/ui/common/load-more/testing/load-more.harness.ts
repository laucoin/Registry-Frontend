import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le chargement du lot suivant d'une liste dans les tests.
 * Périmètre: Lit le décompte affiché et l'état de chargement du bouton, et demande le lot suivant au clic.
 * Limites: Ne déclenche pas la sentinelle ; les tests simulent l'IntersectionObserver.
 */
export class LoadMoreHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-load-more';

	private readonly count = this.locatorFor(byTestId('load-more-count'));
	private readonly button = this.locatorFor(byTestId('load-more-load-more-button'));

	public async countText(): Promise<string> {
		return (await this.count()).text();
	}

	public async loading(): Promise<boolean> {
		return (await this.button()).getProperty<boolean>('loading');
	}

	public async loadMore(): Promise<void> {
		return (await this.button()).click();
	}
}
