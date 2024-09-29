import { GenericEventModel } from './generic-event.model'
import { UserDto } from '../dto/user.dto'

export interface ParticipantModel extends GenericEventModel {
    firstName: string
    lastName: string
    birthday: string
    major: boolean
    begin: Date | undefined
    end: Date | undefined
    user: UserDto | undefined
    purged: boolean
}
