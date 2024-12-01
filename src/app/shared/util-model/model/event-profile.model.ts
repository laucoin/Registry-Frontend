import { GenericEventModel } from './generic-event.model'
import { ProfileStatusEnum } from '../enumeration/profile-status.enum'
import { UserModel } from './user.model'

export interface EventProfileModel extends GenericEventModel {
    user: UserModel
    role: string
    status: ProfileStatusEnum
    startAccess: Date | undefined
    endAccess: Date | undefined
}
