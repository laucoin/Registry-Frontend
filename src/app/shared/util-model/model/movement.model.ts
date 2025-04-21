import { MovementContentModel } from './movement-content.model'
import { GenericEventModel } from './generic-event.model'
import { SelectItem } from 'primeng/api'
import { ActivityModel } from './activity.model'
import { MovementReasonModel } from '../../../domains/movement/data/model/movement-reason.model'

export interface MovementModel extends GenericEventModel {
    dateTime: Date
    type: SelectItem<string>
    reason: MovementReasonModel | undefined
    activity: SelectItem<ActivityModel> | undefined
    content: MovementContentModel[]
}
