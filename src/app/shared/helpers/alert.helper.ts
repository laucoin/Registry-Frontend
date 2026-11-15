import type { SgdfStatusVariant } from '@sgdf/ui';

import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { AlertModel } from '@shared/models/model/alert.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

/**
 * Objectif: Présente les alertes.
 * Périmètre: Construit les select items d'alerte et mappe un statut d'alerte vers une variante de tag.
 * Limites: Aucun état ; la date est formatée par le pipe donné.
 */
export const AlertHelper = {
	toSelectItem(alert: AlertModel, datePipe: DateFormatPipe): SelectOptionModel<AlertModel> {
		return {
			label: `${alert.title} (${datePipe.transform(alert.dateTime, DateFormatTypeEnum.DATETIME)})`,
			value: alert,
		};
	},

	getTagVariant(status: AlertStatusEnum | undefined): SgdfStatusVariant {
		switch (status) {
			case AlertStatusEnum.IN_PROGRESS:
				return 'warning';
			case AlertStatusEnum.CANCELED:
				return 'neutral';
			default:
				return 'success';
		}
	},
} as const;
