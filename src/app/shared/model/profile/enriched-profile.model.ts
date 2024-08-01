import { ProfileModel } from './profile.model'
import { UserModel } from '../user/user.model'
import { EventAuthorityEnum } from '../event/event-authority.enum'

export interface EnrichedProfileModel extends ProfileModel {
    user: UserModel
    authorities: EventAuthorityEnum[]
}
