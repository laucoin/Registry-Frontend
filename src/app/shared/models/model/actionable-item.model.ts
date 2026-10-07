import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

export interface ActionableItemModel {
    requiredUserAuthority?: UserAuthorityEnum | undefined
    requiredProjectAuthority?: ProjectAuthorityEnum | undefined
    requiredProjectOption?: ProjectOptionEnum | undefined
}
