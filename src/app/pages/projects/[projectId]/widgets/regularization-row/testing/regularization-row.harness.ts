import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote une ligne de participant à régulariser dans les tests.
 * Périmètre: Lit le nom, le détail et le lien de la ligne, et suit ce lien.
 * Limites: Ne lit pas l'avatar.
 */
export class RegularizationRowHarness extends ComponentHarness {
	public static readonly hostSelector = '[appRegularizationRow], app-regularization-row';

	private readonly detailText = this.locatorFor(byTestId('regularization-row-detail'));

	public async name(): Promise<string> {
		return (await (await this.host()).text({ exclude: byTestId('regularization-row-detail') })).trim();
	}

	public async detail(): Promise<string> {
		return (await (await this.detailText()).text()).replace(/\s+/g, ' ').trim();
	}

	public async link(): Promise<string | null> {
		return (await this.host()).getProperty<string | null>('href');
	}

	public async open(): Promise<void> {
		return (await this.host()).dispatchEvent('sgdf-navigate');
	}
}
