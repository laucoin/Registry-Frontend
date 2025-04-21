import { MovementContentDto } from './movement-content.dto'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { ParticipantTypeEnum } from '../../../../shared/util-model/enumeration/participant-type.enum'

export interface MovementDto {
    dateTime: Date
    type: string
    reason: string | undefined
    activityId: string | undefined
    contentType: ParticipantTypeEnum
    content: MovementContentDto[]
    guests: ParticipantModel[]
}
