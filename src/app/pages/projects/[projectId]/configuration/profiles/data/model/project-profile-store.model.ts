import { SectionErrorsState } from '@shared/models/model/section-errors-state.model'
import { ProjectProfilePageParamsModel } from '@shared/models/model/project-profile-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { UserModel } from '@shared/models/model/user.model'
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum'

export interface ProjectProfileStoreModel extends SectionErrorsState {
    projectProfiles: PageRequestInformationModel<ProjectProfilePageParamsModel, ProjectProfileModel>
    metadata: {
        roles: SelectOptionModel<string>[]
        status: SelectOptionModel<ProfileStatusEnum | undefined>[]
        searched: SelectOptionModel<UserModel>[]
        availabilities: SelectOptionModel<boolean | undefined>[]
    }
}
