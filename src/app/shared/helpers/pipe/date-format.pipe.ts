import { DatePipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';

/**
 * Objectif: Formate une date avec le motif traduit d'un type.
 * Périmètre: Gère date, time et datetime.
 * Limites: Renvoie undefined pour une valeur vide.
 */
@Pipe({
	name: 'dateFormat',
	pure: false,
})
export class DateFormatPipe implements PipeTransform {
	private readonly datePipe = inject(DatePipe);
	private readonly translateService = inject(TranslocoService);

	public transform(value: Date | string | undefined | null, type: DateFormatTypeEnum): string | undefined {
		const translationKey = `global.date-and-time-format.${type}`;
		return this.datePipe.transform(value?.toString(), this.translateService.translate(translationKey)) ?? undefined;
	}
}
