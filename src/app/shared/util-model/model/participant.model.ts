import { GenericProjectModel } from './generic-project.model'
import { GroupModel } from './group.model'
import { UserModel } from './user.model'
import { CustomDatetimeModel } from './custom-datetime.model'
import { SelectItem } from 'primeng/api'
import { ParticipantTypeEnum } from '../enumeration/participant-type.enum'
import { PresenceStatusEnum } from '../enumeration/presence-status.enum'

export interface ParticipantModel extends GenericProjectModel {
    firstName: string
    lastName: string
    birthday: string
    major: boolean
    type: SelectItem<ParticipantTypeEnum>
    groups: GroupModel[]
    status: SelectItem<PresenceStatusEnum>
    startAvailability: CustomDatetimeModel | undefined
    endAvailability: CustomDatetimeModel | undefined
    user: UserModel | undefined
    purged: boolean
}
