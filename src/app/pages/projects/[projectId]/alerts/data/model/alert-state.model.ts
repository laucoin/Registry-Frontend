import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { SelectItem } from 'primeng/api'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'

export interface AlertStateModel {
    alerts: PageRequestInformationModel<AlertPageParamsModel, AlertModel>
    alert: ElementRequestInformationModel<AlertModel>
    communications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
    _metadata: {
        status: SelectItem<AlertStatusEnum | undefined>[],
        visibilities: SelectItem<boolean | undefined>[],
    }
}
