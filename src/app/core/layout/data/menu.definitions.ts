import { MenuItemModel } from '@core/layout/data/model/menu-item.model'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'
import { UserAuthorityEnum } from '@shared/models/enumeration/user-authority.enum'

export const APP_LEVEL_MENUS: MenuItemModel[] = [
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
		label: 'navbar.project.configuration.title',
		icon: { library: 'solid', name: 'gear' },
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_R,
		items: [
			{
				label: 'navbar.project.configuration.edit-project',
				icon: { library: 'solid', name: 'pen-to-square' },
				url: RegistryRouteEnum.PROJECTS_EDITION,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_U,
			},
			{
				label: 'navbar.project.configuration.project-profiles',
				icon: { library: 'solid', name: 'unlock' },
				url: RegistryRouteEnum.PROJECTS_CONFIGURATION_PROFILES,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_R,
			},
			{
				label: 'navbar.project.configuration.participants',
				icon: { library: 'solid', name: 'user' },
				url: RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_R,
			},
			{
				label: 'navbar.project.configuration.groups',
				icon: { library: 'solid', name: 'users' },
				url: RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R,
			},
			{
				label: 'navbar.project.configuration.vehicles',
				icon: { library: 'solid', name: 'car' },
				url: RegistryRouteEnum.PROJECTS_CONFIGURATION_VEHICLES,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_R,
				requiredProjectOption: ProjectOptionEnum.VEHICLE,
			},
			{
				label: 'navbar.project.configuration.activities',
				icon: { library: 'solid', name: 'hammer' },
				url: RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES,
				requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_R,
				requiredProjectOption: ProjectOptionEnum.ACTIVITY,
			},
		],
	},
]
