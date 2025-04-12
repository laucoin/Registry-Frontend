import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { SelectItem, SelectItemGroup } from 'primeng/api'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { VehicleModel } from '../../../../shared/util-model/model/vehicle.model'

export interface MovementStateModel {
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    movement: ElementRequestInformationModel<MovementModel>
    _metadata: {
        types: SelectItem<string | undefined>[]
        searchedParticipantsAndGroups: SelectItemGroup<ParticipantModel | GroupModel>[]
        searchedVehicles: SelectItem<VehicleModel>[]
        visibilities: SelectItem<boolean | undefined>[]
    }
}
