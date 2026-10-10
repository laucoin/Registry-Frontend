import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Presents alerts.
 * Scope: Builds alert select items and maps an alert status to an icon and a severity.
 * Limits: No state; the date is formatted by the given pipe.
 */
export class AlertHelper {
    public static toSelectItem (alert: AlertModel, datePipe: DateFormatPipe): SelectOptionModel<AlertModel> {
        return {
            label: `${alert.title} (${datePipe.transform( alert.dateTime, 'datetime' )})`,
            value: alert,
        }
    }

    public static getIconFromStatus (status: AlertStatusEnum | undefined): string {
        switch (status) {
            case AlertStatusEnum.IN_PROGRESS:
                return 'pi pi-exclamation-triangle'
            case AlertStatusEnum.CANCELED:
                return 'pi pi-times'
            default:
                return 'pi pi-check'
        }
    }

    public static getSeverityFromStatus (status: AlertStatusEnum | undefined): SeverityEnum {
        switch (status) {
            case AlertStatusEnum.IN_PROGRESS:
                return SeverityEnum.WARNING
            case AlertStatusEnum.CANCELED:
                return SeverityEnum.SECONDARY
            default:
                return SeverityEnum.SUCCESS
        }
    }
}
