import { EventProfilePageParamsModel } from './event-profile-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { EventProfileModel } from '../../../../shared/util-model/model/event-profile.model'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { SelectItem } from 'primeng/api'

export interface EventProfileStateModel {
    eventProfiles: PageRequestInformationModel<EventProfilePageParamsModel, EventProfileModel>
    eventProfile: ElementRequestInformationModel<EventProfileModel>
    roles: SelectItem<string>[]
    searched: SelectItem<UserDto>[]
}
