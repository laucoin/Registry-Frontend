import { GenericEventModel } from './generic-event.model'
import { UserDto } from '../dto/user.dto'
import { GroupModel } from './group.model'

export interface ParticipantModel extends GenericEventModel {
    firstName: string
    lastName: string
    birthday: string
    major: boolean
    groups: GroupModel[]
    begin: Date | undefined
    end: Date | undefined
    user: UserDto | undefined
    purged: boolean
}
