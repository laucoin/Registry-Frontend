import { inject, Pipe, PipeTransform } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { StringHelper } from '@shared/helpers/string.helper';
import { IntervalModel } from '@shared/models/model/interval.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Purpose: Formate un intervalle de durée pour l'affichage.
 * Scope: Affiche les deux plus grandes unités à partir des jours et un format d'horloge en dessous ; avec `hideSeconds`, l'horloge n'affiche que les heures et les minutes et indique « quelques secondes » sous une minute.
 * Limits: Renvoie undefined pour un intervalle vide.
 */
@Pipe({
	name: 'intervalFormat',
	standalone: true,
	pure: false,
})
export class IntervalPipe implements PipeTransform {
	private readonly pluralTranslation = inject(PluralTranslationPipe);
	private readonly translateService = inject(TranslocoService);

	public transform(
		value: IntervalModel | undefined,
		translationKey = 'global.date-and-time-format',
		hideSeconds = false,
	): string | undefined {
		if (!value) return undefined;
		return (
			this.shortLabel(value, translationKey, hideSeconds) ??
			this.largestUnitsLabel(value, translationKey) ??
			this.clockLabel(value, hideSeconds)
		);
	}

	private shortLabel(value: IntervalModel, translationKey: string, hideSeconds: boolean): string | undefined {
		return hideSeconds && this.isUnderOneHour(value) ? this.formatShort(value, translationKey) : undefined;
	}

	private largestUnitsLabel(value: IntervalModel, translationKey: string): string | undefined {
		const pairs = [
			[value.yearCount, value.monthCount],
			[value.monthCount, value.dayCount],
			[value.dayCount, value.hourCount],
		];
		const pair = pairs.find(([largest]) => (largest?.value ?? 0) > 0);
		return pair?.[0] && pair[1] ? this.buildLabel(pair[0], pair[1], translationKey) : undefined;
	}

	private clockLabel(value: IntervalModel, hideSeconds: boolean): string | undefined {
		if (value.hourCount.value > 0) {
			const hourUnits = [value.hourCount, value.minuteCount];
			return this.formatClock(hideSeconds ? hourUnits : [...hourUnits, value.secondCount]);
		}
		const hasMinutesOrSeconds = value.minuteCount.value > 0 || value.secondCount.value > 0;
		return hasMinutesOrSeconds ? this.formatClock([value.minuteCount, value.secondCount]) : undefined;
	}

	private isUnderOneHour(value: IntervalModel): boolean {
		return value.yearCount.value + value.monthCount.value + value.dayCount.value + value.hourCount.value === 0;
	}

	private formatShort(value: IntervalModel, translationKey: string): string {
		return value.minuteCount.value > 0
			? this.formatClock([value.hourCount, value.minuteCount])
			: this.translateService.translate(`${translationKey}.few-seconds`);
	}

	private formatClock(units: SelectOptionModel<number>[]): string {
		return units.map((unit) => StringHelper.formatDigits(unit.value, 2)).join(':');
	}

	private buildLabel(
		first: SelectOptionModel<number>,
		second: SelectOptionModel<number>,
		translationKey: string,
	): string {
		const firstKey = this.pluralTranslation.transform(`${translationKey}.${first.label}`, first.value);
		const secondKey = this.pluralTranslation.transform(`${translationKey}.${second.label}`, second.value);
		return this.translateService.translate(`${translationKey}.interval`, {
			first: this.translateService.translate(firstKey, { count: first.value }),
			second: this.translateService.translate(secondKey, { count: second.value }),
		});
	}
}
