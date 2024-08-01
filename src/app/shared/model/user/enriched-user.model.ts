import { UserModel } from './user.model'
import { ProfileModel } from '../profile/profile.model'
import { EnrichedProfileModel } from '../profile/enriched-profile.model'
import { UserAuthorityEnum } from './user-authority.enum'

export interface EnrichedUserModel extends UserModel {
    defaultProfile: ProfileModel | undefined
    profiles: EnrichedProfileModel[]
    authorities: UserAuthorityEnum[]
}
