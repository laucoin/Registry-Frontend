import { DatePipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

/**
 * Purpose: Formate une date avec le motif traduit d'un type.
 * Scope: Gère date, time et datetime.
 * Limits: Renvoie undefined pour une valeur vide.
 */
@Pipe({
	name: 'dateFormat',
	standalone: true,
	pure: false,
})
export class DateFormatPipe implements PipeTransform {
	private readonly datePipe = inject(DatePipe);
	private readonly translateService = inject(TranslocoService);

	public transform(value: Date | string | undefined | null, type: 'date' | 'time' | 'datetime'): string | undefined {
		const translationKey = `global.date-and-time-format.${type}`;
		return this.datePipe.transform(value?.toString(), this.translateService.translate(translationKey)) ?? undefined;
	}
}
