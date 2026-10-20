import { MenuItemModel } from '@core/layout/data/model/menu-item.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'

export const APP_LEVEL_MENUS: MenuItemModel[] = [
	{
		label: 'navbar.app.home',
		url: RegistryRouteEnum.HOME,
	},
	{
		label: 'navbar.app.projects',
		url: RegistryRouteEnum.PROJECTS,
	},
	{
		label: 'navbar.app.users',
		url: RegistryRouteEnum.USERS,
		requiredUserAuthority: UserAuthorityEnum.REGISTRY_USER_R,
	},
]

export const USER_LEVEL_MENUS: MenuItemModel[] = [
	{
		label: 'navbar.user.my-acccount',
		icon: { library: 'solid', name: 'gear' },
		url: RegistryRouteEnum.MY_ACCOUNT,
	},
	{
		label: 'navbar.user.profiles',
		icon: { library: 'solid', name: 'id-badge' },
		url: RegistryRouteEnum.MY_ACCOUNT_PROJECTS,
	},
	{
		label: 'navbar.user.invitations',
		icon: { library: 'solid', name: 'envelope' },
		url: RegistryRouteEnum.MY_ACCOUNT_INVITATIONS,
	},
]

export const LOGOUT_MENU: MenuItemModel = {
	label: 'navbar.user.logout',
	icon: { library: 'solid', name: 'right-from-bracket' },
}

export const PROJECT_LEVEL_MENUS: MenuItemModel[] = [
	{
		label: 'navbar.project.home',
		icon: { library: 'solid', name: 'chart-simple' },
		url: RegistryRouteEnum.PROJECT,
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
	},
	{
		label: 'navbar.project.movements',
		icon: { library: 'solid', name: 'arrow-right-arrow-left' },
		url: RegistryRouteEnum.PROJECTS_MOVEMENTS,
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_R,
	},
	{
		label: 'navbar.project.alerts',
		icon: { library: 'solid', name: 'triangle-exclamation' },
		url: RegistryRouteEnum.PROJECTS_ALERTS,
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_R,
		requiredProjectOption: ProjectOptionEnum.ALERT,
	},
	{
		label: 'navbar.project.configuration',
		icon: { library: 'solid', name: 'gear' },
		url: RegistryRouteEnum.PROJECTS_CONFIGURATION,
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
	},
]
