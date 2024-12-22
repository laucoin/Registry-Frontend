import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'

export interface GroupPageParamsModel extends PageParamsModel {
    isPresent: boolean
    startDate: string | undefined
    endDate: string | undefined
}
