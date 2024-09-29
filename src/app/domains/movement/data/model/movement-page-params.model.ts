import { PageParamsModel } from '../../../../shared/util-model/model/page-params.model'
import { MovementTypeEnum } from './movement-type.enum'

export interface MovementPageParamsModel extends PageParamsModel {
    type: MovementTypeEnum | undefined,
    startDate: string | undefined
    endDate: string | undefined
}
