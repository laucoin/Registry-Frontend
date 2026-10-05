import { SelectItem } from 'primeng/api'
import { AlertStatusEnum } from '../../util-model/enumeration/alert-status.enum'
import { SeverityEnum } from '../../util-model/enumeration/severity.enum'
import { AlertModel } from '../../util-model/model/alert.model'
import { DateFormatPipe } from '../pipe/date-format.pipe'

export class AlertUtil {
	public static toSelectItem(alert: AlertModel, datePipe: DateFormatPipe): SelectItem<AlertModel> {
		return {
			label: `${alert.title} (${datePipe.transform(alert.dateTime, 'datetime')})`,
			value: alert,
		}
	}

	public static getIconFromStatus(status: AlertStatusEnum | undefined): string {
		switch (status) {
			case AlertStatusEnum.IN_PROGRESS:
				return 'pi pi-exclamation-triangle'
			case AlertStatusEnum.CANCELED:
				return 'pi pi-times'
			default:
				return 'pi pi-check'
		}
	}

	public static getSeverityFromStatus(status: AlertStatusEnum | undefined): SeverityEnum {
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
