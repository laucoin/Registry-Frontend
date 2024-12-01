import { ItemModel } from '../../../../shared/util-model/model/item.model'
import { EventProfilePageParamsModel } from './event-profile-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'

export interface EventProfileStateModel {
    eventProfiles: PageRequestInformationModel<EventProfilePageParamsModel, EventProfileModel>
    eventProfile: ElementRequestInformationModel<EventProfileModel>
    roles: ItemModel[]
}
