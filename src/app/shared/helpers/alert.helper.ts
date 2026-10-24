import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'

/**
 * Purpose: Presents alerts.
 * Scope: Builds alert select items and maps an alert status to a tag variant.
 * Limits: No state; the date is formatted by the given pipe.
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
