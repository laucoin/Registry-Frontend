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

// Tokens are never held here: the backend brokers the OIDC exchange and the SPA only keeps the resulting user.
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
