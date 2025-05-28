import { MovementContentModel } from './movement-content.model'
import { GenericProjectModel } from './generic-project.model'
import { SelectItem } from 'primeng/api'
import { ActivityModel } from './activity.model'
import { MovementReasonModel } from '../../../domains/project/movement/data/model/movement-reason.model'
import { ParticipantTypeEnum } from '../enumeration/participant-type.enum'
import { MovementTypeEnum } from '../enumeration/movement-type.enum'

export interface MovementModel extends GenericProjectModel {
    dateTime: Date
    type: SelectItem<MovementTypeEnum>
    reason: MovementReasonModel | undefined
    activity: SelectItem<ActivityModel> | undefined
    contentType: ParticipantTypeEnum
    content: MovementContentModel[]
}
