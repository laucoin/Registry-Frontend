import { ToastMessageOptions } from 'primeng/api'
import { EventProfilePageParamsModel } from '../../../domains/event-profile/data/model/event-profile-page-params.model'
import { TokenModel } from '../../util-authentication/model/token.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageRequestInformationModel } from '../../util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../util-model/model/element-request-information.model'
import { EventModel } from '../../util-model/model/event.model'

export interface RegistryStateModel {
    authentication: {
        token: TokenModel | undefined
        currentUser: CurrentUserModel | undefined
    },
    profiles: PageRequestInformationModel<EventProfilePageParamsModel, EventProfileModel>,
    invitations: PageRequestInformationModel<EventProfilePageParamsModel, EventProfileModel>,
    profile: ElementRequestInformationModel<EventProfileModel>,
    event: ElementRequestInformationModel<EventModel>,
    _util: {
        theme: 'light' | 'dark'
        online: boolean | undefined
        notification: ToastMessageOptions | undefined
        loading: boolean
        error: ToastMessageOptions | undefined
    }
}
