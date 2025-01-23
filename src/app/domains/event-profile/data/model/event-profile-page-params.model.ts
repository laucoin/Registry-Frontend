import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'

export interface EventProfilePageParamsModel extends PageParamsModel {
    onlyUsable: boolean
    status: string | undefined
    startAccess: string | undefined
    endAccess: string | undefined
}
