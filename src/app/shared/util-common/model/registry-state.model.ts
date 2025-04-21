import { ToastMessageOptions } from 'primeng/api'
import { TokenModel } from '../../util-authentication/model/token.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { EventProfileModel } from '../../util-model/model/event-profile.model'
import { PageRequestInformationModel } from '../../util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../util-model/model/element-request-information.model'
import {
    UserEventProfilePageParamsModel,
} from '../../../domains/event-profile/data/model/user-event-profile-page-params.model'

export interface RegistryStateModel {
    authentication: {
        token: TokenModel | undefined
        currentUser: CurrentUserModel | undefined
    },
    profiles: PageRequestInformationModel<UserEventProfilePageParamsModel, EventProfileModel>,
    invitations: PageRequestInformationModel<UserEventProfilePageParamsModel, EventProfileModel>,
    profile: ElementRequestInformationModel<EventProfileModel>,
    _util: {
        theme: 'light' | 'dark'
        screenWidth: number
        online: boolean | undefined
        notification: ToastMessageOptions | undefined
        loading: boolean
        error: ToastMessageOptions | undefined
    }
}
