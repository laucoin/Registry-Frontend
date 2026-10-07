import { VehiclePageParamsModel } from '@pages/projects/[projectId]/configuration/vehicles/data/model/vehicle-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { VehicleModel } from '@shared/models/model/vehicle.model'
import { SelectItem } from 'primeng/api'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

export interface VehicleStoreModel {
    vehicles: PageRequestInformationModel<VehiclePageParamsModel, VehicleModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    metadata: {
        availabilities: SelectItem<boolean | undefined>[]
        visibilities: SelectItem<boolean | undefined>[]
        presencesStatus: SelectItem<PresenceStatusEnum | undefined>[]
    }
}
