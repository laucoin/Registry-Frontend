import { ProjectProfilePageParamsModel } from '@pages/projects/[projectId]/configuration/profiles/data/model/project-profile-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { SelectItem } from 'primeng/api'
import { UserModel } from '@shared/models/model/user.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'

export interface ProjectProfileStateModel {
    projectProfiles: PageRequestInformationModel<ProjectProfilePageParamsModel, ProjectProfileModel>
    _metadata: {
        roles: SelectItem<string>[]
        status: SelectItem<ProfileStatusEnum | undefined>[]
        searched: SelectItem<UserModel>[]
        availabilities: SelectItem<boolean | undefined>[]
    }
}
