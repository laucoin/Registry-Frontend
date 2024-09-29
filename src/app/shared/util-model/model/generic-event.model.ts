import { EventModel } from './event.model'
import { GenericModel } from './generic.model'

export interface GenericEventModel extends GenericModel {
    event: EventModel
}
