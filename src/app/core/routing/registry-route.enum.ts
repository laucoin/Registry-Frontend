import { ProjectRoutesEnum } from '@pages/projects/project-routes.enum'
import { ProjectProfileRoutesEnum } from '@pages/projects/[projectId]/configuration/profiles/project-profile-routes.enum'
import { ParticipantRoutesEnum } from '@pages/projects/[projectId]/configuration/participants/participant-routes.enum'
import { MovementRoutesEnum } from '@pages/projects/[projectId]/movements/movement-routes.enum'
import { GroupRoutesEnum } from '@pages/projects/[projectId]/configuration/groups/group-routes.enum'
import { UserRoutesEnum } from '@pages/users/user-routes.enum'
import { VehicleRoutesEnum } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-routes.enum'
import { ActivityRoutesEnum } from '@pages/projects/[projectId]/configuration/activities/activity-routes.enum'
import { ConfigurationRoutesEnum } from '@pages/projects/[projectId]/configuration/configuration-routes.enum'

export enum RegistryRouteEnum {
    AUTH_CALLBACK = 'auth/callback',

    USERS = 'users',
    USERS_EDITION = `${USERS}/${UserRoutesEnum.EDIT}`,
    USERS_PROFILES = `${USERS}/${UserRoutesEnum.PROFILES}`,
    USERS_INVITATIONS = `${USERS}/${UserRoutesEnum.INVITATIONS}`,
    USERS_SETTINGS = `${USERS}/${UserRoutesEnum.SETTINGS}`,

    PROJECTS = 'projects',
    PROJECTS_CREATION = `${PROJECTS}/${ProjectRoutesEnum.CREATE}`,

    PROJECT = `${PROJECTS}/${ProjectRoutesEnum.PROJECT_ID}`,
    PROJECTS_EDITION = `${PROJECT}/${ProjectRoutesEnum.EDIT}`,

    PROJECTS_MOVEMENTS = `${PROJECT}/${ProjectRoutesEnum.MOVEMENTS}`,
    PROJECTS_MOVEMENTS_EDITION = `${PROJECTS_MOVEMENTS}/${MovementRoutesEnum.EDIT}`,

    PROJECTS_ALERTS = `${PROJECT}/${ProjectRoutesEnum.ALERTS}`,

    PROJECTS_CONFIGURATION = `${PROJECT}/${ProjectRoutesEnum.CONFIGURATION}`,

    PROJECTS_CONFIGURATION_PROFILES = `${PROJECTS_CONFIGURATION}/${ConfigurationRoutesEnum.PROFILES}`,
    PROJECTS_CONFIGURATION_PROFILES_EDITION = `${PROJECTS_CONFIGURATION_PROFILES}/${ProjectProfileRoutesEnum.EDIT}`,

    PROJECTS_CONFIGURATION_PARTICIPANTS = `${PROJECTS_CONFIGURATION}/${ConfigurationRoutesEnum.PARTICIPANTS}`,
    PROJECTS_CONFIGURATION_PARTICIPANTS_EDITION = `${PROJECTS_CONFIGURATION_PARTICIPANTS}/${ParticipantRoutesEnum.EDIT}`,
    PROJECTS_CONFIGURATION_PARTICIPANTS_MOVEMENTS = `${PROJECTS_CONFIGURATION_PARTICIPANTS}/${ParticipantRoutesEnum.MOVEMENTS}`,

    PROJECTS_CONFIGURATION_GROUPS = `${PROJECTS_CONFIGURATION}/${ConfigurationRoutesEnum.GROUPS}`,
    PROJECTS_CONFIGURATION_GROUPS_EDITION = `${PROJECTS_CONFIGURATION_GROUPS}/${GroupRoutesEnum.EDIT}`,
    PROJECTS_CONFIGURATION_GROUPS_MEMBERS = `${PROJECTS_CONFIGURATION_GROUPS}/${GroupRoutesEnum.MEMBERS}`,

    PROJECTS_CONFIGURATION_VEHICLES = `${PROJECTS_CONFIGURATION}/${ConfigurationRoutesEnum.VEHICLES}`,
    PROJECTS_CONFIGURATION_VEHICLES_EDITION = `${PROJECTS_CONFIGURATION_VEHICLES}/${VehicleRoutesEnum.EDIT}`,
    PROJECTS_CONFIGURATION_VEHICLES_MOVEMENTS = `${PROJECTS_CONFIGURATION_VEHICLES}/${VehicleRoutesEnum.MOVEMENTS}`,

    PROJECTS_CONFIGURATION_ACTIVITIES = `${PROJECTS_CONFIGURATION}/${ConfigurationRoutesEnum.ACTIVITIES}`,
    PROJECTS_CONFIGURATION_ACTIVITIES_EDITION = `${PROJECTS_CONFIGURATION_ACTIVITIES}/${ActivityRoutesEnum.EDIT}`,
    PROJECTS_CONFIGURATION_ACTIVITIES_MOVEMENTS = `${PROJECTS_CONFIGURATION_ACTIVITIES}/${ActivityRoutesEnum.MOVEMENTS}`,
}
