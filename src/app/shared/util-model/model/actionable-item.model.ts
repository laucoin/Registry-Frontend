import { ProjectAuthorityEnum } from '../enumeration/project-authority.enum'
import { UserAuthorityEnum } from '../enumeration/user-authority.enum'
import { ProjectOptionEnum } from '../enumeration/project-option.enum'

export interface ActionableItemModel {
    requiredUserAuthority?: UserAuthorityEnum | undefined
    requiredProjectAuthority?: ProjectAuthorityEnum | undefined
    requiredProjectOption?: ProjectOptionEnum | undefined
}
