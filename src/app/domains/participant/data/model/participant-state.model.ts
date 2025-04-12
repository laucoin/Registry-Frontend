import { ParticipantPageParamsModel } from './participant-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { SelectItem } from 'primeng/api'
import { GroupModel } from '../../../../shared/util-model/model/group.model'
import { MovementPageParamsModel } from '../../../../shared/util-model/model/movement-page-params.model'
import { MovementModel } from '../../../../shared/util-model/model/movement.model'
import { UserModel } from '../../../../shared/util-model/model/user.model'

export interface ParticipantStateModel {
    participants: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    participant: ElementRequestInformationModel<ParticipantModel>
    _metadata: {
        searchedUsers: SelectItem<UserModel>[]
        searchedGroups: SelectItem<GroupModel>[]
        presencesStatus: SelectItem<string | undefined>[]
        visibilities: SelectItem<boolean | undefined>[]
    }
}
