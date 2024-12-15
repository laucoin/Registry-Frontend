import { ProfileStatusEnum } from '../../../../shared/util-model/enumeration/profile-status.enum'
import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'

export interface EventProfilePageParamsModel extends PageParamsModel {
    onlyUsable: boolean
    status: ProfileStatusEnum | undefined
    startAccess: string | undefined
    endAccess: string | undefined
}
