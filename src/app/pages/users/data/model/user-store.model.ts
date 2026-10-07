import { UserModel } from '@shared/models/model/user.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { SelectItem } from 'primeng/api'
import { UserPageParamsModel } from '@pages/users/data/model/user-page-params.model'

export interface UserStoreModel {
    users: PageRequestInformationModel<UserPageParamsModel, UserModel>
    user: ElementRequestInformationModel<UserModel>
    metadata: {
        assignableRoles: SelectItem<string>[]
        status: SelectItem<boolean | undefined>[]
    }
}
