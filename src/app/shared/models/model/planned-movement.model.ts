import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { MovementReasonModel } from '@shared/models/model/movement-reason.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface PlannedMovementModel {
    type: SelectOptionModel<MovementTypeEnum>
    reason: MovementReasonModel | undefined
    contentType: ParticipantTypeEnum
    plannedAt: CustomDatetimeModel | undefined
    poolName: string | undefined
    participants: ParticipantModel[]
}
