import { SectionErrorsState } from '@shared/models/model/section-errors-state.model'
import { UserModel } from '@shared/models/model/user.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { UserPageParamsModel } from '@shared/models/model/user-page-params.model'

export interface UserStoreModel extends SectionErrorsState {
    users: PageRequestInformationModel<UserPageParamsModel, UserModel>
    user: ElementRequestInformationModel<UserModel>
    metadata: {
        assignableRoles: SelectOptionModel<string>[]
        status: SelectOptionModel<boolean | undefined>[]
    }
}
