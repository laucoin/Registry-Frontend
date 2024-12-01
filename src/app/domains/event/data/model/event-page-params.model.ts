import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'

export interface EventPageParamsModel extends PageParamsModel {
    startDate: string | undefined
    endDate: string | undefined
}
