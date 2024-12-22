import { MovementPageParamsModel } from './movement-page-params.model'
import { MovementModel } from './movement.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { SelectItemGroup } from 'primeng/api'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { GroupModel } from '../../../../shared/util-model/model/group.model'

export interface MovementStateModel {
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    movement: ElementRequestInformationModel<MovementModel>
    searched: SelectItemGroup<ParticipantModel | GroupModel>[]
}
