import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { ConfigurationTileModel } from '@pages/projects/[projectId]/configuration/data/model/configuration-tile.model'
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum'
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum'

export const CONFIGURATION_TILES: ConfigurationTileModel[] = [
	{
		key: 'participants',
		icon: { library: 'solid', name: 'user' },
		url: RegistryRouteEnum.PROJECTS_CONFIGURATION_PARTICIPANTS,
		count: 'participants',
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PARTICIPANT_R,
	},
	{
		key: 'groups',
		icon: { library: 'solid', name: 'users' },
		url: RegistryRouteEnum.PROJECTS_CONFIGURATION_GROUPS,
		count: 'groups',
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_R,
	},
	{
		key: 'vehicles',
		icon: { library: 'solid', name: 'car' },
		url: RegistryRouteEnum.PROJECTS_CONFIGURATION_VEHICLES,
		count: 'vehicles',
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_VEHICLE_R,
		requiredProjectOption: ProjectOptionEnum.VEHICLE,
	},
	{
		key: 'activities',
		icon: { library: 'solid', name: 'hammer' },
		url: RegistryRouteEnum.PROJECTS_CONFIGURATION_ACTIVITIES,
		count: 'activities',
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_ACTIVITY_R,
		requiredProjectOption: ProjectOptionEnum.ACTIVITY,
	},
	{
		key: 'profiles',
		icon: { library: 'solid', name: 'unlock' },
		url: RegistryRouteEnum.PROJECTS_CONFIGURATION_PROFILES,
		count: 'acceptedProfiles',
		requiredProjectAuthority: ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_R,
	},
]
