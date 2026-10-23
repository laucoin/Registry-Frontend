import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertPageParamsModel } from '@shared/models/model/alert-page-params.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@shared/models/model/communication.model'

export interface AlertStoreModel {
    alerts: PageRequestInformationModel<AlertPageParamsModel, AlertModel>
    communications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
    metadata: {
        status: SelectOptionModel<AlertStatusEnum | undefined>[],
        visibilities: SelectOptionModel<boolean | undefined>[],
    }
}
