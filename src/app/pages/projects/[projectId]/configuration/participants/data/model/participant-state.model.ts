import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import {
    ElementRequestInformationModel,
} from '@shared/models/model/element-request-information.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectItem } from 'primeng/api'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { UserModel } from '@shared/models/model/user.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

export interface ParticipantStateModel {
    participants: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    participant: ElementRequestInformationModel<ParticipantModel>
    _metadata: {
        searchedUsers: SelectItem<UserModel>[]
        searchedGroups: SelectItem<GroupModel>[]
        presencesStatus: SelectItem<PresenceStatusEnum | undefined>[]
        visibilities: SelectItem<boolean | undefined>[]
    }
}
