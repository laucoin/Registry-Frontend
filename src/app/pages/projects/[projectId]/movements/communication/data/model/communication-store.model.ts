import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { SelectItem } from 'primeng/api'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'

export interface CommunicationStoreModel {
    communications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
    communication: ElementRequestInformationModel<CommunicationModel>
    _metadata: {
        searchedMovements: SelectItem<MovementModel>[]
        searchedAlerts: SelectItem<AlertModel>[]
        visibilities: SelectItem<boolean | undefined>[],
    }
}
