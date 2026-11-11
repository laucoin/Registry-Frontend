import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';

export enum VehicleStatisticEnum {
	OUT = 'out',
	USAGE = 'usage',
}

export interface VehicleStatisticView {
	hint: string;
	loading: boolean;
	value: string | number | undefined;
}

/**
 * Objectif: Pilote les statistiques d'un véhicule dans les tests.
 * Périmètre: Lit, par statistique, son explication, son état de chargement et sa valeur.
 * Limites: Ne lit pas le titre des statistiques.
 */
export class VehicleStatisticsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-vehicle-statistics';

	private readonly values = {
		out: this.locatorForOptional(`${byTestId('vehicle-statistics-out-stat')} sgdf-format-duration`),
		usage: this.locatorForOptional(`${byTestId('vehicle-statistics-usage-stat')} sgdf-format-number`),
	};

	public async shown(): Promise<boolean> {
		return (await this.locatorForOptional(byTestId('vehicle-statistics-out-stat'))()) !== null;
	}

	public async statistic(name: VehicleStatisticEnum): Promise<VehicleStatisticView> {
		const stat = await this.locatorFor(byTestId(`vehicle-statistics-${name}-stat`))();
		const value = await this.values[name]();
		return {
			hint: await stat.getProperty<string>('hint'),
			loading: await stat.getProperty<boolean>('loading'),
			value: (await value?.getProperty<string | number>('value')) ?? undefined,
		};
	}
}
