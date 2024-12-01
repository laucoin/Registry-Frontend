import { EventRoutesEnum } from './domains/event/event-routes.enum'
import { EventProfileRoutesEnum } from './domains/event-profile/event-profile-routes.enum'
import { PreferencesRoutesEnum } from './domains/preferences/preferences-routes.enum'
import { ParticipantRoutesEnum } from './domains/participant/participant-routes.enum'
import { MovementRoutesEnum } from './domains/movement/movement-routes.enum'

export enum AppRouteEnum {
    HOME = 'home',
    AUTH_CALLBACK = 'auth-callback',
    SIGN_OUT_CALLBACK = 'sign-out-callback',
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
    MOVEMENTS = `${EVENTS}/:eventId/movements`,
    MOVEMENTS_CREATION = `${MOVEMENTS}/${MovementRoutesEnum.CREATE}`,
}
