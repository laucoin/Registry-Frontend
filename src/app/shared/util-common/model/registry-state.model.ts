import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { TokenModel } from '../../util-authentication/model/token.model'
import { CurrentUserModel } from '../../util-model/model/current-user.model'
import { ProjectProfileModel } from '../../util-model/model/project-profile.model'
import { PageRequestInformationModel } from '../../util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../util-model/model/element-request-information.model'
import {
    UserProjectProfilePageParamsModel,
} from '../../../domains/project/configuration/project-profile/data/model/user-project-profile-page-params.model'
import { ThemeEnum } from '../../util-model/enumeration/theme.enum'

export interface RegistryStateModel {
    authentication: {
        token: TokenModel | undefined
        currentUser: CurrentUserModel | undefined,
        loading: boolean,
    },
    profiles: PageRequestInformationModel<UserProjectProfilePageParamsModel, ProjectProfileModel>,
    invitations: PageRequestInformationModel<UserProjectProfilePageParamsModel, ProjectProfileModel>,
    profile: ElementRequestInformationModel<ProjectProfileModel>,
    _util: {
        theme: ThemeEnum
        screenWidth: number
        online: boolean | undefined
        notification: ToastMessageOptions | undefined
        loading: boolean
        error: ToastMessageOptions | undefined
    }
    _metadata: {
        themes: SelectItem<ThemeEnum>[],
        languages: SelectItem<string>[],
    }
}
