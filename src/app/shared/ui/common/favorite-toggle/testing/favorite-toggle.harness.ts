import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote le bouton favori dans les tests.
 * Périmètre: Lit l'état pressé, l'apparence et le libellé de l'étoile, et la bascule.
 * Limites: Ne lit pas l'icône, fixée par le composant.
 */
export class FavoriteToggleHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-favorite-toggle';

	private readonly button = this.locatorFor(byTestId('favorite-toggle-toggled-button'));

	public async pressed(): Promise<string | null> {
		return (await this.button()).getAttribute('aria-pressed');
	}

	public async library(): Promise<string> {
		return (await this.button()).getProperty<string>('library');
	}

	public async variant(): Promise<string> {
		return (await this.button()).getProperty<string>('variant');
	}

	public async label(): Promise<string> {
		return (await this.button()).getProperty<string>('label');
	}

	public async toggle(): Promise<void> {
		return (await this.button()).click();
	}
}
