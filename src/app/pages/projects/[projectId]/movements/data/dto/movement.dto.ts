import { MovementContentDto } from '@pages/projects/[projectId]/movements/data/dto/movement-content.dto'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'

export interface MovementDto {
    dateTime: Date
    type: string
    reason: string | undefined
    activityId: string | undefined
    contentType: ParticipantTypeEnum
    content: MovementContentDto[]
    guests: ParticipantModel[]
}
