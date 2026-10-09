import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { SelectOptionModel, SelectOptionGroupModel } from '@shared/models/model/select-option.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { GroupModel } from '@shared/models/model/group.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { CommunicationPageParamsModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication-page-params.model'
import { CommunicationModel } from '@shared/models/model/communication.model'

export interface MovementStoreModel {
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    movementCommunications: PageRequestInformationModel<CommunicationPageParamsModel, CommunicationModel>
    metadata: {
        types: SelectOptionModel<MovementTypeEnum | undefined>[]
        participantTypes: SelectOptionModel<ParticipantTypeEnum>[]
        searchedReasonsAndActivities: MovementReasonModel[]
        searchedParticipantsAndGroups: SelectOptionGroupModel<ParticipantModel | GroupModel>[]
        searchedVehicles: SelectOptionModel<VehicleModel>[]
        visibilities: SelectOptionModel<boolean | undefined>[]
    }
}
