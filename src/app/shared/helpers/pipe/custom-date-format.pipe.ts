import { DatePipe } from '@angular/common';
import { inject, Pipe, PipeTransform } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

import { DateHelper } from '@shared/helpers/date.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';

function typeOf(value: CustomDatetimeModel): DateFormatTypeEnum {
	if (GenericHelper.isNull(value.time)) return DateFormatTypeEnum.DATE;
	return GenericHelper.isNull(value.date) ? DateFormatTypeEnum.TIME : DateFormatTypeEnum.DATETIME;
}

/**
 * Objectif: Formate une date-heure personnalisée en date, en heure ou les deux.
 * Périmètre: Choisit le motif traduit selon ce que contient la valeur.
 * Limites: Renvoie undefined pour une valeur vide.
 */
@Pipe({
	name: 'customDateFormat',
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
