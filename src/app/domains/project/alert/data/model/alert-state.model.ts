import { SelectItem } from 'primeng/api'
import { AlertStatusEnum } from '../../../../../shared/util-model/enumeration/alert-status.enum'
import { AlertPageParamsModel } from '../../../../../shared/util-model/model/alert-page-params.model'
import { AlertModel } from '../../../../../shared/util-model/model/alert.model'
import {
    ElementRequestInformationModel,
} from '../../../../../shared/util-model/model/element-request-information.model'
import { PageRequestInformationModel } from '../../../../../shared/util-model/model/page-request-information.model'
import { CommunicationPageParamsModel } from '../../../communication/data/model/communication-page-params.model'
import { CommunicationModel } from '../../../communication/data/model/communication.model'

export interface AlertStateModel {
	alerts: PageRequestInformationModel<AlertPageParamsModel, AlertModel>
	alert: ElementRequestInformationModel<AlertModel>
	communications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
	_metadata: {
		status: SelectItem<AlertStatusEnum | undefined>[],
		visibilities: SelectItem<boolean | undefined>[],
	}
}
