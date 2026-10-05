import { ParticipantTypeEnum } from '../../../../../shared/util-model/enumeration/participant-type.enum'
import { ParticipantModel } from '../../../../../shared/util-model/model/participant.model'
import { MovementContentDto } from './movement-content.dto'

export interface MovementDto {
	dateTime: Date
	type: string
	reason: string | undefined
	activityId: string | undefined
	contentType: ParticipantTypeEnum
	content: MovementContentDto[]
	guests: ParticipantModel[]
}
