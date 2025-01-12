import { EventRoutesEnum } from './domains/event/event-routes.enum'
import { EventProfileRoutesEnum } from './domains/event-profile/event-profile-routes.enum'
import { PreferencesRoutesEnum } from './domains/preferences/preferences-routes.enum'
import { ParticipantRoutesEnum } from './domains/participant/participant-routes.enum'
import { MovementRoutesEnum } from './domains/movement/movement-routes.enum'
import { GroupRoutesEnum } from './domains/group/group-routes.enum'

export enum AppRouteEnum {
    HOME = 'home',
    AUTH_CALLBACK = 'callback',
    LOGOUT_CALLBACK = 'logout-callback',
    USERS = 'users',
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
    MOVEMENTS = `${EVENTS}/:eventId/movements`,
    MOVEMENTS_CREATION = `${MOVEMENTS}/${MovementRoutesEnum.CREATE}`,
    MOVEMENTS_EDITION = `${MOVEMENTS}/${MovementRoutesEnum.EDIT}`,
    GROUPS = `${EVENTS}/:eventId/groups`,
    GROUPS_CREATION = `${GROUPS}/${GroupRoutesEnum.CREATE}`,
    GROUPS_EDITION = `${GROUPS}/${GroupRoutesEnum.EDIT}`,
    GROUP_MEMBERS = `${GROUPS}/${GroupRoutesEnum.MEMBERS}`,
}
