import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { SelectItem, SelectItemGroup } from 'primeng/api'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GroupModel } from '@shared/models/model/group.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { MovementReasonModel } from '@pages/projects/[projectId]/movements/data/model/movement-reason.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'

export interface MovementStateModel {
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    movementCommunications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
    movement: ElementRequestInformationModel<MovementModel>
    _metadata: {
        types: SelectItem<MovementTypeEnum | undefined>[]
        participantTypes: SelectItem<ParticipantTypeEnum>[]
        searchedReasonsAndActivities: MovementReasonModel[]
        searchedParticipantsAndGroups: SelectItemGroup<ParticipantModel | GroupModel>[]
        searchedVehicles: SelectItem<VehicleModel>[]
        visibilities: SelectItem<boolean | undefined>[]
    }
}
