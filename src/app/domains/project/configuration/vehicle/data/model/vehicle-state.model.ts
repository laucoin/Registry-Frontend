import { VehiclePageParamsModel } from './vehicle-page-params.model'
import { PageRequestInformationModel } from '../../../../../../shared/util-model/model/page-request-information.model'
import {
    ElementRequestInformationModel,
} from '../../../../../../shared/util-model/model/element-request-information.model'
import { MovementPageParamsModel } from '../../../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../../../shared/util-model/model/movement.model'
import { VehicleModel } from '../../../../../../shared/util-model/model/vehicle.model'
import { SelectItem } from 'primeng/api'
import { PresenceStatusEnum } from '../../../../../../shared/util-model/enumeration/presence-status.enum'

export interface VehicleStateModel {
    vehicles: PageRequestInformationModel<VehiclePageParamsModel, VehicleModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    vehicle: ElementRequestInformationModel<VehicleModel>
    _metadata: {
        availabilities: SelectItem<boolean | undefined>[]
        visibilities: SelectItem<boolean | undefined>[]
        presencesStatus: SelectItem<PresenceStatusEnum | undefined>[]
    }
}
