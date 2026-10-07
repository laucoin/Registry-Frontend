import { SelectItem, ToastMessageOptions } from 'primeng/api'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import {
    UserProjectProfilePageParamsModel,
} from '@pages/projects/[projectId]/configuration/profiles/data/model/user-project-profile-page-params.model'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

export interface RegistryStoreModel {
    authentication: {
        currentUser: CurrentUserModel | undefined,
        loading: boolean,
    },
    currentProject: {
        id: string | undefined,
        profile: ProjectProfileModel | undefined,
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
