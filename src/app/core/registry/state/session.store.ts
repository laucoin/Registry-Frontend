import { patchState, signalStore, withMethods, withState, WritableStateSource } from '@ngrx/signals';

import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

interface SessionStoreModel {
	currentUser: CurrentUserModel | undefined;
	currentProject: {
		id: string | undefined;
		project: ProjectModel | undefined;
	};
}

const defaultSessionStore: SessionStoreModel = {
	currentUser: undefined,
	currentProject: { id: undefined, project: undefined },
};

function preferenceSetter(store: WritableStateSource<SessionStoreModel>, key: 'theme' | 'refreshMode') {
	return (value: string): void =>
		patchState(store, (state: SessionStoreModel) =>
			state.currentUser
				? {
						currentUser: {
							...state.currentUser,
							preferences: { ...state.currentUser.preferences, [key]: value },
						},
					}
				: state,
		);
}

/**
 * Objectif: Détient l'utilisateur connecté et le projet sélectionné.
 * Périmètre: Possède l'état de session ; les jetons ne sont jamais détenus ici.
 * Limites: Le backend orchestre l'échange OIDC, ce store ne conserve donc que l'utilisateur obtenu ; il n'authentifie pas et ne détient pas les profils de l'utilisateur.
 */
export const SessionStore = signalStore(
	{ providedIn: 'root' },
	withState<SessionStoreModel>(defaultSessionStore),
	withMethods((store) => ({
		setCurrentUser: (currentUser: CurrentUserModel) => patchState(store, { currentUser: currentUser }),
		setCurrentUserTheme: preferenceSetter(store, 'theme'),
		setCurrentUserRefreshMode: preferenceSetter(store, 'refreshMode'),
		setCurrentProject: (id: string | undefined, project: ProjectModel | undefined) =>
			patchState(store, { currentProject: { id: id, project: project } }),
		reset: () => patchState(store, defaultSessionStore),
	})),
);
