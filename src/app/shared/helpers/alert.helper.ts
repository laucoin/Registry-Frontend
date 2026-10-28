import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'

/**
 * Purpose: Présente les alertes.
 * Scope: Construit les select items d'alerte et mappe un statut d'alerte vers une variante de tag.
 * Limits: Aucun état ; la date est formatée par le pipe donné.
 */
export class AlertHelper {
    public static toSelectItem (alert: AlertModel, datePipe: DateFormatPipe): SelectOptionModel<AlertModel> {
        return {
            label: `${alert.title} (${datePipe.transform( alert.dateTime, 'datetime' )})`,
            value: alert,
        }
    }

    public static getTagVariant (status: AlertStatusEnum | undefined): 'warning' | 'neutral' | 'success' {
        switch (status) {
            case AlertStatusEnum.IN_PROGRESS:
                return 'warning'
            case AlertStatusEnum.CANCELED:
                return 'neutral'
            default:
                return 'success'
        }
    }
}
