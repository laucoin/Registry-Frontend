import { SectionErrorsState } from '@shared/models/model/section-errors-state.model'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { AlertModel } from '@shared/models/model/alert.model'

export interface CommunicationStoreModel extends SectionErrorsState {
    communication: ElementRequestInformationModel<CommunicationModel>
    metadata: {
        searchedMovements: SelectOptionModel<MovementModel>[]
        searchedAlerts: SelectOptionModel<AlertModel>[]
    }
}
