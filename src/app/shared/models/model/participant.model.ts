import { OptionalProjectModel } from '@shared/models/model/generic-project.model'
import { GroupModel } from '@shared/models/model/group.model'
import { UserModel } from '@shared/models/model/user.model'
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum'
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum'

export interface ParticipantModel extends OptionalProjectModel {
    firstName: string
    lastName: string
    birthday: string
    major: boolean
    type: SelectOptionModel<ParticipantTypeEnum>
    groups: GroupModel[] | undefined
    status: SelectOptionModel<PresenceStatusEnum>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    user: UserModel | undefined
    purged: boolean
}
