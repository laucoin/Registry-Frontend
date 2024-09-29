import { MovementTypeEnum } from './movement-type.enum'
import { MovementContentModel } from './movement-content.model'
import { GenericEventModel } from '../../../../shared/util-model/model/generic-event.model'

export interface MovementModel extends GenericEventModel {
    dateTime: Date
    type: MovementTypeEnum
    content: MovementContentModel[]
}
