import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';

export interface ActionableItemModel {
	requiredUserAuthority?: UserAuthorityEnum | undefined;
	requiredProjectAuthority?: ProjectAuthorityEnum | undefined;
	requiredProjectOption?: ProjectOptionEnum | undefined;
}
