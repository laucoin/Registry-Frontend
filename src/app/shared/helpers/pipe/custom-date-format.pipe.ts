import { DatePipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

import { DateHelper } from '@shared/helpers/date.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';

function typeOf(value: CustomDatetimeModel): 'date' | 'time' | 'datetime' {
	if (GenericHelper.isNull(value.time)) return 'date';
	return GenericHelper.isNull(value.date) ? 'time' : 'datetime';
}

/**
 * Purpose: Formate une date-heure personnalisée en date, en heure ou les deux.
 * Scope: Choisit le motif traduit selon ce que contient la valeur.
 * Limits: Renvoie undefined pour une valeur vide.
 */
@Pipe({
	name: 'customDateFormat',
	standalone: true,
	pure: false,
})
export class CustomDateFormatPipe implements PipeTransform {
	private readonly datePipe = inject(DatePipe);
	private readonly translateService = inject(TranslocoService);

	public transform(value: CustomDatetimeModel | undefined | null): string | undefined {
		const formattedValue = DateHelper.toDate(value);

		if (!value || GenericHelper.isNull(formattedValue)) return undefined;

		const translationKey = `global.date-and-time-format.${typeOf(value)}`;

		return (
			this.datePipe.transform(formattedValue.toString(), this.translateService.translate(translationKey)) ??
			undefined
		);
	}
}
