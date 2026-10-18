import { MovementReasonResponseDto } from '@shared/models/dto/response/movement-reason.response.dto'
import { ParticipantResponseDto } from '@shared/models/dto/response/participant.response.dto'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface PlannedMovementResponseDto {
    type: SelectOptionModel<MovementTypeEnum>
    reason: MovementReasonResponseDto | undefined
    contentType: ParticipantTypeEnum
    plannedAt: CustomDatetimeModel | undefined
    poolName: string | undefined
    participants: ParticipantResponseDto[]
}
