import { ParticipantPageParamsModel } from './participant-page-params.model'
import { PageRequestInformationModel } from '../../../../shared/util-model/model/page-request-information.model'
import { ElementRequestInformationModel } from '../../../../shared/util-model/model/element-request-information.model'
import { ParticipantModel } from '../../../../shared/util-model/model/participant.model'
import { UserDto } from '../../../../shared/util-model/dto/user.dto'
import { SelectItem } from 'primeng/api'
import { GroupModel } from '../../../../shared/util-model/model/group.model'

export interface ParticipantStateModel {
    participants: PageRequestInformationModel<ParticipantPageParamsModel, ParticipantModel>
    participant: ElementRequestInformationModel<ParticipantModel>
    searchedUsers: SelectItem<UserDto>[]
    searchedGroups: SelectItem<GroupModel>[]
}
