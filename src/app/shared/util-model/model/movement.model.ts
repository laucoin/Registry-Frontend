import { SelectItem } from 'primeng/api'
import { MovementReasonModel } from '../../../domains/project/movement/data/model/movement-reason.model'
import { MovementTypeEnum } from '../enumeration/movement-type.enum'
import { ParticipantTypeEnum } from '../enumeration/participant-type.enum'
import { ActivityModel } from './activity.model'
import { GenericProjectModel } from './generic-project.model'
import { MovementContentModel } from './movement-content.model'

export interface MovementModel extends GenericProjectModel {
	dateTime: Date
	type: SelectItem<MovementTypeEnum>
	reason: MovementReasonModel | undefined
	activity: SelectItem<ActivityModel> | undefined
	contentType: ParticipantTypeEnum
	content: MovementContentModel[]
}
