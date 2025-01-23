import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'

export interface MovementPageParamsModel extends PageParamsModel {
    type: string | undefined,
    startDate: string | undefined
    endDate: string | undefined
}
