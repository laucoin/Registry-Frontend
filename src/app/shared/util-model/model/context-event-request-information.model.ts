import { EventModel } from './event.model'
import { ElementRequestInformationModel } from './element-request-information.model'

export interface ContextEventRequestInformationModel extends ElementRequestInformationModel<EventModel> {
    id: string | undefined
}
