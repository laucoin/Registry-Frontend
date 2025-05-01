import { ProjectProfilePageParamsModel } from './project-profile-page-params.model'
import { PageRequestInformationModel } from '../../../../../../shared/util-model/model/page-request-information.model'
import {
    ElementRequestInformationModel,
} from '../../../../../../shared/util-model/model/element-request-information.model'
import { ProjectProfileModel } from '../../../../../../shared/util-model/model/project-profile.model'
import { SelectItem } from 'primeng/api'
import { UserModel } from '../../../../../../shared/util-model/model/user.model'
import { ProfileStatusEnum } from '../../../../../../shared/util-model/enumeration/profile-status.enum'

export interface ProjectProfileStateModel {
    projectProfiles: PageRequestInformationModel<ProjectProfilePageParamsModel, ProjectProfileModel>
    projectProfile: ElementRequestInformationModel<ProjectProfileModel>
    _metadata: {
        roles: SelectItem<string>[]
        status: SelectItem<ProfileStatusEnum | undefined>[]
        searched: SelectItem<UserModel>[]
        availabilities: SelectItem<boolean | undefined>[]
    }
}
