import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'
import { UserModel } from '../../../../shared/util-model/model/user.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { SelectItem } from 'primeng/api'

export interface UserStateModel {
    users: PageRequestInformationModel<PageParamsModel, UserModel>
    user: ElementRequestInformationModel<UserModel>
    searched: UserDto[]
    assignableRoles: SelectItem<string>[]
}
