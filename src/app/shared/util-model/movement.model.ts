import { MovementContentModel } from './movement-content.model'
import { GenericEventModel } from './model/generic-event.model'
import { SelectItem } from 'primeng/api'

export interface MovementModel extends GenericEventModel {
    dateTime: Date
    type: SelectItem<string>
    content: MovementContentModel[]
}
