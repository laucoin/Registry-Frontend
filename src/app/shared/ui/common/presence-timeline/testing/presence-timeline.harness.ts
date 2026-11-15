import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

export interface TimelineView {
	start: string;
	end: string;
	ranges: { variant: string; label?: string }[];
}

export enum TimelineKindEnum {
	PLANNED = 'planned',
	ACTUAL = 'actual',
}

/**
 * Objectif: Pilote les frises de présence dans les tests.
 * Périmètre: Lit les frises prévue et réelle, leurs messages vides, l'absence de période, le chargement et l'erreur.
 * Limites: Lit les plages passées aux frises, pas leur rendu graphique, porté par `@sgdf/ui`.
 */
export class PresenceTimelineHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-presence-timeline';

	private readonly loadingBlock = this.locatorForOptional(byTestId('presence-timeline-loading'));
	private readonly noPeriod = this.locatorForOptional(byTestId('presence-timeline-no-period'));

	public readonly error = this.locatorForOptional(SectionErrorHarness);

	public async timeline(kind: TimelineKindEnum): Promise<TimelineView | undefined> {
		const element = await this.locatorForOptional(byTestId(`presence-timeline-${kind}-timeline`))();
		if (!element) return undefined;
		return {
			start: await element.getProperty<string>('start'),
			end: await element.getProperty<string>('end'),
			ranges: await element.getProperty<TimelineView['ranges']>('ranges'),
		};
	}

	public async emptyShown(kind: TimelineKindEnum): Promise<boolean> {
		return (await this.locatorForOptional(byTestId(`presence-timeline-${kind}-empty`))()) !== null;
	}

	public async noPeriodShown(): Promise<boolean> {
		return (await this.noPeriod()) !== null;
	}

	public async busy(): Promise<string | null | undefined> {
		return (await this.loadingBlock())?.getAttribute('aria-busy');
	}
}
