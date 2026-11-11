import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la liste squelette dans les tests.
 * Périmètre: Compte les lignes et les lignes de description, lit l'apparence, l'état occupé et le libellé de la liste.
 * Limites: Ne lit pas la forme ni l'animation des squelettes.
 */
export class SkeletonListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-skeleton-list';

	private readonly list = this.locatorFor(byTestId('skeleton-list-list'));
	private readonly rows = this.locatorForAll(byTestId('skeleton-list-row'));
	private readonly descriptions = this.locatorForAll(byTestId('skeleton-list-description'));

	public async rowCount(): Promise<number> {
		return (await this.rows()).length;
	}

	public async descriptionCount(): Promise<number> {
		return (await this.descriptions()).length;
	}

	public async appearance(): Promise<string> {
		return (await this.list()).getProperty<string>('appearance');
	}

	public async busy(): Promise<string | null> {
		return (await this.list()).getAttribute('aria-busy');
	}

	public async label(): Promise<string> {
		return (await this.list()).getProperty<string>('label');
	}
}
