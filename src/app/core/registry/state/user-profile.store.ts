import { inject } from '@angular/core';

import { patchState, signalStore, withMethods, withState, WritableStateSource } from '@ngrx/signals';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api';
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { pageFetcher, paramsMerger } from '@shared/helpers/store/paged-store.methods';
import { ProfileStatusEnum } from '@shared/models/enumeration/profile-status.enum';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';
import { UserProjectProfilePageParamsModel } from '@shared/models/model/user-project-profile-page-params.model';

type ProfilesPage = PageRequestInformationModel<UserProjectProfilePageParamsModel, UserInvitationModel>;

interface UserProfileState {
	invitations: ProfilesPage;
}

const invitationParams: UserProjectProfilePageParamsModel = {
	resetSearch: false,
	isAvailable: undefined,
	status: ProfileStatusEnum.INVITED,
	q: undefined,
	at: undefined,
	sort: undefined,
};

const defaultUserProfileState: UserProfileState = {
	invitations: PageStateHelper.initial<UserProjectProfilePageParamsModel, UserInvitationModel>(invitationParams),
};

function projectFavoriteSetter(store: WritableStateSource<UserProfileState>) {
	return (projectId: string, favorite: boolean): void => {
		const withFavorite = (block: ProfilesPage): ProfilesPage =>
			block.element
				? {
						...block,
						element: {
							...block.element,
							content: block.element.content.map((profile) =>
								profile.project?.id === projectId
									? { ...profile, project: { ...profile.project, favorite } }
									: profile,
							),
						},
					}
				: block;
		patchState(store, (state: UserProfileState): Partial<UserProfileState> => ({
			invitations: withFavorite(state.invitations),
		}));
	};
}

/**
 * Objectif: Détient les invitations de l'utilisateur connecté.
 * Périmètre: Possède les récupérations paginées des invitations propres à l'utilisateur.
 * Limites: Ne sait rien de l'utilisateur connecté ni du projet sélectionné ; le store de session les détient.
 */
export const UserProfileStore = signalStore(
	{ providedIn: 'root' },
	withState<UserProfileState>(defaultUserProfileState),
	withMethods((store, api = inject(UserProjectProfileApi), errors = inject(ErrorReporter)) => ({
		fetchInvitationsPage: pageFetcher(
			store,
			'invitations',
			(request: CumulativePageRequest, params) => api.findUserProjectProfiles(request.page, request.size, params),
			errors,
			{ merge: CumulativePageHelper.merge },
		),
		refreshInvitationsPage: pageFetcher(
			store,
			'invitations',
			(request: CumulativePageRequest, params) => api.findUserProjectProfiles(request.page, request.size, params),
			errors,
			{ merge: CumulativePageHelper.merge, silent: true },
		),
	})),
	withMethods((store) => ({
		updateInvitationsPageSearchParams: paramsMerger(store, 'invitations'),
		setProjectFavorite: projectFavoriteSetter(store),
		reset: () => patchState(store, defaultUserProfileState),
	})),
);
