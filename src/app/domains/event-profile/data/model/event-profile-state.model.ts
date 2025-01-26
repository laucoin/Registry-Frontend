import { EventProfilePageParamsModel } from './event-profile-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { SelectItem } from 'primeng/api'
import { UserModel } from '../../../../shared/util-model/model/user.model'

export interface EventProfileStateModel {
    eventProfiles: PageRequestInformationModel<EventProfilePageParamsModel, EventProfileModel>
    eventProfile: ElementRequestInformationModel<EventProfileModel>
    _metadata: {
        roles: SelectItem<string>[]
        status: SelectItem<string>[]
        searched: SelectItem<UserModel>[]
    }
}
