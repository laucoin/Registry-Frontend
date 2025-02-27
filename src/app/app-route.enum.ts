import { EventRoutesEnum } from './domains/event/event-routes.enum'
import { EventProfileRoutesEnum } from './domains/event-profile/event-profile-routes.enum'
import { PreferencesRoutesEnum } from './domains/preferences/preferences-routes.enum'
import { ParticipantRoutesEnum } from './domains/participant/participant-routes.enum'
import { MovementRoutesEnum } from './domains/movement/movement-routes.enum'
import { GroupRoutesEnum } from './domains/group/group-routes.enum'
import { UserRoutesEnum } from './domains/user/user-routes.enum'
import { VehicleRoutesEnum } from './domains/vehicle/vehicle-routes.enum'
import { ActivityRoutesEnum } from './domains/activity/activity-routes.enum'

export enum AppRouteEnum {
    HOME = 'home',
    AUTH_CALLBACK = 'callback',
    LOGOUT_CALLBACK = 'logout-callback',
    USERS = 'users',
    USERS_EDITION = `${USERS}/${UserRoutesEnum.EDIT}`,
    PREFERENCES = `${USERS}/preferences`,
    PREFERENCES_PROFILES = `${PREFERENCES}/${PreferencesRoutesEnum.PROFILES}`,
    PREFERENCES_INVITATIONS = `${PREFERENCES}/${PreferencesRoutesEnum.INVITATIONS}`,
    EVENTS = 'events',
    EVENTS_CREATION = `${EVENTS}/${EventRoutesEnum.CREATE}`,
    EVENTS_EDITION = `${EVENTS}/${EventRoutesEnum.EDIT}`,
    PROFILES = `${EVENTS}/:eventId/profiles`,
    PROFILES_INVITATION = `${PROFILES}/${EventProfileRoutesEnum.INVITE}`,
    PROFILES_EDITION = `${PROFILES}/${EventProfileRoutesEnum.EDIT}`,
    PARTICIPANTS = `${EVENTS}/:eventId/participants`,
    PARTICIPANTS_CREATION = `${PARTICIPANTS}/${ParticipantRoutesEnum.CREATE}`,
    PARTICIPANTS_EDITION = `${PARTICIPANTS}/${ParticipantRoutesEnum.EDIT}`,
    PARTICIPANTS_MOVEMENTS = `${PARTICIPANTS}/${ParticipantRoutesEnum.MOVEMENTS}`,
    MOVEMENTS = `${EVENTS}/:eventId/movements`,
    MOVEMENTS_CREATION = `${MOVEMENTS}/${MovementRoutesEnum.CREATE}`,
    MOVEMENTS_EDITION = `${MOVEMENTS}/${MovementRoutesEnum.EDIT}`,
    GROUPS = `${EVENTS}/:eventId/groups`,
    GROUPS_CREATION = `${GROUPS}/${GroupRoutesEnum.CREATE}`,
    GROUPS_EDITION = `${GROUPS}/${GroupRoutesEnum.EDIT}`,
    GROUP_MEMBERS = `${GROUPS}/${GroupRoutesEnum.MEMBERS}`,
    VEHICLES = `${EVENTS}/:eventId/vehicles`,
    VEHICLES_CREATION = `${VEHICLES}/${VehicleRoutesEnum.CREATE}`,
    VEHICLES_EDITION = `${VEHICLES}/${VehicleRoutesEnum.EDIT}`,
    VEHICLES_MOVEMENTS = `${VEHICLES}/${VehicleRoutesEnum.MOVEMENTS}`,
    ACTIVITIES = `${EVENTS}/:eventId/activities`,
    ACTIVITIES_CREATION = `${ACTIVITIES}/${ActivityRoutesEnum.CREATE}`,
    ACTIVITIES_EDITION = `${ACTIVITIES}/${ActivityRoutesEnum.EDIT}`,
    ACTIVITIES_MOVEMENTS = `${ACTIVITIES}/${ActivityRoutesEnum.MOVEMENTS}`,
}
