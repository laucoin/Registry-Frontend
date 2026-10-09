import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'

export interface CommunicationStoreModel {
    communications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
    communication: ElementRequestInformationModel<CommunicationModel>
    metadata: {
        searchedMovements: SelectOptionModel<MovementModel>[]
        searchedAlerts: SelectOptionModel<AlertModel>[]
        visibilities: SelectOptionModel<boolean | undefined>[],
    }
}
