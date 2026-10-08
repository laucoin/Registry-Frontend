import { ActivityResponseDto } from '@shared/models/dto/response/activity.response.dto'
import { GenericProjectResponseDto } from '@shared/models/dto/response/generic-project.response.dto'
import { MovementContentResponseDto } from '@shared/models/dto/response/movement-content.response.dto'
import { MovementReasonResponseDto } from '@shared/models/dto/response/movement-reason.response.dto'
import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { SelectItem } from 'primeng/api'

export interface MovementResponseDto extends GenericProjectResponseDto {
    dateTime: Date
    type: SelectItem<MovementTypeEnum>
    reason: MovementReasonResponseDto | undefined
    activity: SelectItem<ActivityResponseDto> | undefined
    contentType: ParticipantTypeEnum
    content: MovementContentResponseDto[]
}
