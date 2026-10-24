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
 * Purpose: Détient l'utilisateur connecté et le projet sélectionné.
 * Scope: Possède l'état de session ; les jetons ne sont jamais détenus ici.
 * Limits: Le backend orchestre l'échange OIDC, ce store ne conserve donc que l'utilisateur obtenu ; il n'authentifie pas et ne détient pas les profils de l'utilisateur.
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
        setCurrentUserRefreshMode: (refreshMode: string): void => patchState( store, (state: SessionStoreModel) => (
            state.currentUser
            ? { currentUser: { ...state.currentUser, preferences: { ...state.currentUser.preferences, refreshMode: refreshMode } } }
            : state
        ) ),
        setCurrentProject: (id: string | undefined, project: ProjectModel | undefined): void => {
            patchState( store, { currentProject: { id: id, project: project } } )
        },
        reset: (): void => patchState( store, defaultSessionStore ),
    }) ),
)
