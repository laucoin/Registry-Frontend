import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { CurrentUserModel } from '@shared/models/model/current-user.model'
import { ProjectModel } from '@shared/models/model/project.model'

interface SessionStoreModel {
    currentUser: CurrentUserModel | undefined
    currentProject: {
        id: string | undefined
        project: ProjectModel | undefined
    }
}

const defaultSessionStore: SessionStoreModel = {
    currentUser: undefined,
    currentProject: { id: undefined, project: undefined },
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
        setCurrentProject: (id: string | undefined, project: ProjectModel | undefined): void => {
            patchState( store, { currentProject: { id: id, project: project } } )
        },
        reset: (): void => patchState( store, defaultSessionStore ),
    }) ),
)
