import { GenericEventModel } from './generic-event.model'
import { GroupModel } from './group.model'
import { UserModel } from './user.model'

export interface ParticipantModel extends GenericEventModel {
    firstName: string
    lastName: string
    birthday: string
    major: boolean
    groups: GroupModel[]
    begin: Date | undefined
    end: Date | undefined
    user: UserModel | undefined
    purged: boolean
}
