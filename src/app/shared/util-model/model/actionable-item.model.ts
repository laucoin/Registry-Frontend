import { EventAuthorityEnum } from '../enumeration/event-authority.enum'
import { UserAuthorityEnum } from '../enumeration/user-authority.enum'

export interface ActionableItemModel {
    requiredUserAuthority: UserAuthorityEnum | undefined
    requiredEventAuthority: EventAuthorityEnum | undefined
    requiredEventOption: string | undefined
}
