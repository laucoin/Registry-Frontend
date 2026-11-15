import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

export enum ActivityStatisticEnum {
	PARTICIPATION = 'participation',
	MOVEMENT = 'movement',
	MAN = 'man',
}

export interface ActivityStatisticView {
	hint: string;
	loading: boolean;
	value: string | number | undefined;
}

/**
 * Objectif: Pilote les statistiques d'une activité dans les tests.
 * Périmètre: Lit, par statistique, son explication, son état de chargement et sa valeur, et donne l'erreur affichée.
 * Limites: Ne lit pas le titre des statistiques.
 */
export class ActivityStatisticsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-activity-statistics';

	private readonly values = {
		participation: this.locatorForOptional(
			`${byTestId('activity-statistics-participation-stat')} sgdf-format-number`,
		),
		movement: this.locatorForOptional(`${byTestId('activity-statistics-movement-stat')} sgdf-format-duration`),
		man: this.locatorForOptional(`${byTestId('activity-statistics-man-stat')} sgdf-format-duration`),
	};

	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async shown(): Promise<boolean> {
		return (await this.locatorForOptional(byTestId('activity-statistics-participation-stat'))()) !== null;
	}

	public async statistic(name: ActivityStatisticEnum): Promise<ActivityStatisticView> {
		const stat = await this.locatorFor(byTestId(`activity-statistics-${name}-stat`))();
		const value = await this.values[name]();
		return {
			hint: await stat.getProperty<string>('hint'),
			loading: await stat.getProperty<boolean>('loading'),
			value: (await value?.getProperty<string | number>('value')) ?? undefined,
		};
	}
}
