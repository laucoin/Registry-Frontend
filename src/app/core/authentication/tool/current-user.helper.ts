import { ArrayHelper } from '@shared/helpers/array.helper';
import { GenericHelper } from '@shared/helpers/generic.helper';
import { ProjectHelper } from '@shared/helpers/project.helper';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { RefreshModeEnum } from '@shared/models/enumeration/refresh-mode.enum';
import { ThemeEnum } from '@shared/models/enumeration/theme.enum';
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum';
import { ActionableItemModel } from '@shared/models/model/actionable-item.model';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

function hasRequiredProject(project: ProjectModel | undefined, actionableItem: ActionableItemModel): boolean {
	return !!project || !(actionableItem.requiredProjectOption || actionableItem.requiredProjectAuthority);
}

function buildAuthority(
	requiredAuthority: ProjectAuthorityEnum | undefined,
	id: string | undefined,
): UserAuthorityEnum | string | undefined {
	if (GenericHelper.isNull(requiredAuthority)) return undefined;

	return `${id}_${requiredAuthority}`;
}

function hasAuthority(
	currentUser: CurrentUserModel | undefined,
	authority: UserAuthorityEnum | string | undefined,
): boolean {
	if (!currentUser) return false;
	return ArrayHelper.includes(currentUser.authorities, authority);
}

/**
 * Purpose: Répond aux questions d'autorité, d'option de projet et de thème sur l'utilisateur courant.
 * Scope: Fonctions pures sur le modèle utilisateur : faisabilité d'une action, recherche d'autorités et mapping de thème.
 * Limits: N'impose jamais rien ; le backend est la seule frontière de sécurité.
 */
export const CurrentUserHelper = {
	isFeasible(
		currentUser: CurrentUserModel | undefined,
		project: ProjectModel | undefined,
		actionableItem: ActionableItemModel,
	): boolean {
		if (GenericHelper.isNull(currentUser) || !hasRequiredProject(project, actionableItem)) return false;

		return (
			ProjectHelper.hasOption(project, actionableItem.requiredProjectOption) &&
			hasAuthority(currentUser, actionableItem.requiredUserAuthority) &&
			hasAuthority(currentUser, buildAuthority(actionableItem.requiredProjectAuthority, project?.id))
		);
	},

	hasProjectAuthority(
		currentUser: CurrentUserModel | undefined,
		id: string | undefined,
		authority: ProjectAuthorityEnum,
	): boolean {
		if (GenericHelper.isNull(currentUser) || !id) return false;

		return hasAuthority(currentUser, buildAuthority(authority, id));
	},

	hasUserAuthority(currentUser: CurrentUserModel | undefined, authority: UserAuthorityEnum): boolean {
		if (GenericHelper.isNull(currentUser)) return false;

		return hasAuthority(currentUser, authority);
	},

	mapThemeToEnum(theme: string): ThemeEnum {
		switch (theme) {
			case 'DARK':
				return ThemeEnum.DARK;
			case 'LIGHT':
				return ThemeEnum.LIGHT;
			default:
				return ThemeEnum.SYSTEM;
		}
	},

	mapRefreshModeToEnum(mode: string | undefined): RefreshModeEnum {
		return Object.values(RefreshModeEnum).find((it) => it === mode) ?? RefreshModeEnum.NORMAL;
	},

	mapThemeToString(theme: ThemeEnum): string {
		switch (theme) {
			case ThemeEnum.DARK:
				return 'DARK';
			case ThemeEnum.LIGHT:
				return 'LIGHT';
			default:
				return ThemeEnum.SYSTEM;
		}
	},
} as const;
