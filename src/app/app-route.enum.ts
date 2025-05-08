import { ProjectRoutesEnum } from './domains/project/project-routes.enum'
import { ProjectProfileRoutesEnum } from './domains/project/configuration/project-profile/project-profile-routes.enum'
import { ParticipantRoutesEnum } from './domains/project/configuration/participant/participant-routes.enum'
import { MovementRoutesEnum } from './domains/project/movement/movement-routes.enum'
import { GroupRoutesEnum } from './domains/project/configuration/group/group-routes.enum'
import { UserRoutesEnum } from './domains/user/user-routes.enum'
import { VehicleRoutesEnum } from './domains/project/configuration/vehicle/vehicle-routes.enum'
import { ActivityRoutesEnum } from './domains/project/configuration/activity/activity-routes.enum'
import { ConfigurationRoutesEnum } from './domains/project/configuration/configuration-routes.enum'
import { CommunicationRoutesEnum } from './domains/project/communication/communication-routes.enum'

export enum AppRouteEnum {
    AUTH_CALLBACK = 'auth/callback',

    USERS = 'users',
    USERS_EDITION = `${USERS}/${UserRoutesEnum.EDIT}`,
    USERS_INVITATION = `${USERS}/${UserRoutesEnum.INVITATIONS}`,
    USERS_SETTING = `${USERS}/${UserRoutesEnum.SETTINGS}`,

    PROJECTS = 'projects',
    PROJECTS_CREATION = `${PROJECTS}/${ProjectRoutesEnum.CREATE}`,
    PROJECTS_EDITION = `${PROJECTS}/${ProjectRoutesEnum.EDIT}`,

    PROJECTS_SELECTED = `${PROJECTS}/${ProjectRoutesEnum.SELECTED}`,

    PROJECTS_MOVEMENTS = `${PROJECTS}/${ProjectRoutesEnum.MOVEMENTS}`,
    PROJECTS_MOVEMENTS_EDITION = `${PROJECTS_MOVEMENTS}/${MovementRoutesEnum.EDIT}`,
    PROJECTS_MOVEMENTS_COMMUNICATIONS = `${PROJECTS_MOVEMENTS}/${MovementRoutesEnum.COMMUNICATIONS}`,

    PROJECTS_COMMUNICATIONS = `${PROJECTS}/${ProjectRoutesEnum.COMMUNICATIONS}`,
    PROJECTS_COMMUNICATIONS_EDITION = `${PROJECTS_COMMUNICATIONS}/${CommunicationRoutesEnum.EDIT}`,

    PROJECTS_CONFIGURATION = `${PROJECTS}/${ProjectRoutesEnum.CONFIGURATION}`,

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
