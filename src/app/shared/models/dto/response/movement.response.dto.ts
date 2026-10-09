import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto'
import { OptionalProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { MovementContentResponseDto } from '@shared/models/dto/response/movement-content.response.dto'
import { MovementReasonResponseDto } from '@shared/models/dto/response/movement-reason.response.dto'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { SelectOptionModel } from '@shared/models/model/select-option.model'

export interface MovementResponseDto extends OptionalProjectResponseDto {
    dateTime: Date
    type: SelectOptionModel<MovementTypeEnum>
    reason: MovementReasonResponseDto | undefined
    activity: SelectOptionModel<ActivityResponseDto> | undefined
    contentType: ParticipantTypeEnum
    content: MovementContentResponseDto[]
}
