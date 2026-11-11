import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

export enum AlertsStatisticEnum {
	RESOLUTION = 'resolution',
	RATE = 'rate',
}

export interface AlertsStatisticView {
	hint: string;
	loading: boolean;
	value: string | number | undefined;
}

/**
 * Objectif: Pilote les statistiques des alertes dans les tests.
 * Périmètre: Lit, par statistique, son explication, son état de chargement et sa valeur, et donne l'erreur affichée.
 * Limites: Ne lit pas le titre des statistiques.
 */
export class AlertsStatisticsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-alerts-statistics';

	private readonly values = {
		resolution: this.locatorForOptional(`${byTestId('alerts-statistics-resolution-stat')} sgdf-format-duration`),
		rate: this.locatorForOptional(`${byTestId('alerts-statistics-rate-stat')} sgdf-format-number`),
	};

	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async shown(): Promise<boolean> {
		return (await this.locatorForOptional(byTestId('alerts-statistics-rate-stat'))()) !== null;
	}

	public async statistic(name: AlertsStatisticEnum): Promise<AlertsStatisticView> {
		const stat = await this.locatorFor(byTestId(`alerts-statistics-${name}-stat`))();
		const value = await this.values[name]();
		return {
			hint: await stat.getProperty<string>('hint'),
			loading: await stat.getProperty<boolean>('loading'),
			value: (await value?.getProperty<string | number>('value')) ?? undefined,
		};
	}
}
