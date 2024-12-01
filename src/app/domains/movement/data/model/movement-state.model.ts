import { MovementPageParamsModel } from './movement-page-params.model'
import { MovementModel } from './movement.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'

export interface MovementStateModel {
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    movement: ElementRequestInformationModel<MovementModel>
}
