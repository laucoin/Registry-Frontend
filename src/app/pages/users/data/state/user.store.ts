import { inject } from '@angular/core';

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { UserApi } from '@core/registry/state/user.api';
import { UserStoreModel } from '@pages/users/data/model/user-store.model';
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import {
	elementFetcher,
	loaderToggle,
	metadataFetcher,
	pageFetcher,
	paramsUpdater,
	trackElement,
} from '@shared/helpers/store/paged-store.methods';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';
import { UserPageParamsModel } from '@shared/models/model/user-page-params.model';

const defaultUser: ElementRequestInformationModel<UserModel> = {
	element: undefined,
	loading: false,
	error: undefined,
};

const defaultUserStore: UserStoreModel = {
	sectionErrors: {},
	users: PageStateHelper.initial<UserPageParamsModel, UserModel>({
		resetSearch: false,
		q: undefined,
		isVisible: undefined,
		sort: undefined,
	}),
	user: defaultUser,
	metadata: {
		assignableRoles: [],
		status: [
			{ label: '-', value: undefined },
			{ label: 'users.visible.true', value: true },
			{ label: 'users.visible.false', value: false },
		],
	},
};

/**
 * Objectif: Détient l'état des utilisateurs.
 * Périmètre: Possède les données des pages et ressources d'utilisateurs avec leurs drapeaux de chargement et d'erreur, et les récupère via l'api des utilisateurs.
 * Limites: Atteint via la facade des utilisateurs ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const UserStore = signalStore(
	withState<UserStoreModel>(defaultUserStore),
	withMethods((store, api = inject(UserApi), errors = inject(ErrorReporter)) => ({
		fetchUsersPage: pageFetcher(
			store,
			'users',
			(request: CumulativePageRequest, params) => api.findUsers(request.page, request.size, params),
			errors,
			{ merge: CumulativePageHelper.merge },
		),
		updateUsersPageSearchParams: paramsUpdater(store, 'users'),
		startUserLoader: loaderToggle(store, 'user', true),
		stopUserLoader: loaderToggle(store, 'user', false),
		fetchUser: elementFetcher(store, 'user', (id: string) => api.findUserById(id)),
		resetUser: () => patchState(store, { user: defaultUser }),
		fetchAssignableRoles: metadataFetcher<UserStoreModel, 'assignableRoles', void, SelectOptionModel<string>[]>(
			store,
			'assignableRoles',
			() => api.getAssignableUserRoles().pipe(trackElement(store, 'user')),
		),
	})),
);
