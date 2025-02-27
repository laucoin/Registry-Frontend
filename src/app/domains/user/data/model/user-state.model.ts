import { UserModel } from '../../../../shared/util-model/model/user.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { SelectItem } from 'primeng/api'
import { UserPageParamsModel } from './user-page-params.model'

export interface UserStateModel {
    users: PageRequestInformationModel<UserPageParamsModel, UserModel>
    user: ElementRequestInformationModel<UserModel>
    _metadata: {
        assignableRoles: SelectItem<string>[]
        status: SelectItem<boolean | undefined>[]
    }
}
