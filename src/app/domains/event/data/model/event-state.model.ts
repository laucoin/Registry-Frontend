import { EventModel } from '../../../../shared/util-model/model/event.model'
import { EventPageParamsModel } from './event-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { EventOptionModel } from './event-option.model'

export interface EventStateModel {
    events: PageRequestInformationModel<EventPageParamsModel, EventModel>
    event: ElementRequestInformationModel<EventModel>
    _metadata: {
        options: EventOptionModel[]
    }
}
