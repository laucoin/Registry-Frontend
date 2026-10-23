import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { GroupModel } from '@shared/models/model/group.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { UserModel } from '@shared/models/model/user.model'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

export interface ParticipantStoreModel {
    participants: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    metadata: {
        searchedUsers: SelectOptionModel<UserModel>[]
        searchedGroups: SelectOptionModel<GroupModel>[]
        presencesStatus: SelectOptionModel<PresenceStatusEnum | undefined>[]
        visibilities: SelectOptionModel<boolean | undefined>[]
    }
}
