import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectProfileModel } from '@shared/models/model/project-profile.model'

interface SessionStoreModel {
    currentUser: CurrentUserModel | undefined
    actionLoading: boolean
    currentProject: {
        id: string | undefined
        profile: ProjectProfileModel | undefined
    }
}

const defaultSessionStore: SessionStoreModel = {
    currentUser: undefined,
    actionLoading: false,
    currentProject: { id: undefined, profile: undefined },
}

/**
 * Purpose: Holds the signed-in user and the selected project.
 * Scope: Owns the session state; tokens are never held here.
 * Limits: The backend brokers the OIDC exchange, so this store keeps only the resulting user; it does not authenticate nor hold the user's profiles.
 */
export const SessionStore = signalStore(
    { providedIn: 'root' },
    withState<SessionStoreModel>( defaultSessionStore ),
    withMethods( (store) => ({
        setCurrentUser: (currentUser: CurrentUserModel): void => patchState( store, { currentUser: currentUser } ),
        setCurrentUserTheme: (theme: string): void => patchState( store, (state: SessionStoreModel) => (
            state.currentUser
            ? { currentUser: { ...state.currentUser, preferences: { ...state.currentUser.preferences, theme: theme } } }
            : state
        ) ),
        setCurrentProject: (id: string | undefined, profile: ProjectProfileModel | undefined): void => {
            patchState( store, { currentProject: { id: id, profile: profile } } )
        },
        startActionLoader: (): void => patchState( store, { actionLoading: true } ),
        stopActionLoader: (): void => patchState( store, { actionLoading: false } ),
        reset: (): void => patchState( store, defaultSessionStore ),
    }) ),
)
