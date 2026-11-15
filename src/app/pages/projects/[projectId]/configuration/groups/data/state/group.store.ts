import { inject } from '@angular/core';

import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { GroupPageParamsModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-page-params.model';
import { GroupStoreModel } from '@pages/projects/[projectId]/configuration/groups/data/model/group-store.model';
import { GroupApi } from '@pages/projects/[projectId]/configuration/groups/data/state/group.api';
import { ParticipantPageParamsModel } from '@pages/projects/[projectId]/configuration/participants/data/model/participant-page-params.model';
import { ErrorSink, notifyOnError } from '@shared/helpers/rx.helper';
import { CumulativePageHelper, CumulativePageRequest } from '@shared/helpers/store/cumulative-page.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { pageFetcher, paramsUpdater, StoreRef } from '@shared/helpers/store/paged-store.methods';
import { withProfileScope } from '@shared/helpers/store/with-profile-scope.feature';
import { GroupModel } from '@shared/models/model/group.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

interface GroupsPageRequest extends CumulativePageRequest {
	projectId: string | undefined;
}

interface GroupMembersPageRequest extends GroupsPageRequest {
	id: string;
}

interface SearchParticipantsRequest {
	projectId: string | undefined;
	q: string | undefined;
}

type GroupStoreRef = StoreRef<GroupStoreModel>;

const defaultMembers: GroupStoreModel['members'] = {
	...PageStateHelper.initial<ParticipantPageParamsModel, ParticipantModel>({
		resetSearch: false,
		isVisible: undefined,
		status: undefined,
		q: undefined,
		sort: undefined,
	}),
	groupId: undefined,
};

const defaultGroupStore: GroupStoreModel = {
	groups: PageStateHelper.initial<GroupPageParamsModel, GroupModel>({
		resetSearch: false,
		q: undefined,
		isVisible: undefined,
		isPresent: undefined,
		at: undefined,
		sort: undefined,
	}),
	members: defaultMembers,
	metadata: {
		searched: [],
		availabilities: [
			{ label: '-', value: undefined },
			{ label: 'groups.available.true', value: true },
			{ label: 'groups.available.false', value: false },
		],
		visibilities: [
			{ label: '-', value: undefined },
			{ label: 'groups.visible.true', value: true },
			{ label: 'groups.visible.false', value: false },
		],
	},
};

function fetchGroupMembersPage(
	store: GroupStoreRef,
	api: GroupApi,
	errors: ErrorSink,
): RxMethod<GroupMembersPageRequest> {
	return pageFetcher(
		store,
		'members',
		(request, params) =>
			api.findGroupMembersByGroupId(request.projectId, request.id, request.page, request.size, params),
		errors,
		{
			before: (request) => resetMembersOnGroupChange(store, request.id),
			merge: CumulativePageHelper.merge,
		},
	);
}

function resetMembersOnGroupChange(store: GroupStoreRef, groupId: string): void {
	if (store.members.groupId() !== groupId) {
		patchState(store, { members: { ...defaultMembers, groupId: groupId } });
	}
}

function searchParticipants(
	store: GroupStoreRef,
	api: GroupApi,
	errors: ErrorSink,
): RxMethod<SearchParticipantsRequest> {
	return rxMethod<SearchParticipantsRequest>(
		pipe(
			switchMap((request) => api.searchParticipants(request.projectId, request.q).pipe(notifyOnError(errors))),
			tap((participants) =>
				patchState(store, (state: GroupStoreModel) => ({
					metadata: { ...state.metadata, searched: participants },
				})),
			),
		),
	);
}

/**
 * Objectif: Détient l'état des groupes.
 * Périmètre: Possède les données des pages et ressources de groupes avec leurs drapeaux de chargement et d'erreur, et les récupère via l'api des groupes.
 * Limites: Atteint via la facade des groupes ; ne formate pas les données et ne notifie pas l'utilisateur du résultat des commandes.
 */
export const GroupStore = signalStore(
	withState<GroupStoreModel>(defaultGroupStore),
	withProfileScope<GroupStoreModel>(defaultGroupStore),
	withMethods((store, api = inject(GroupApi), errors = inject(ErrorReporter)) => ({
		fetchGroupsPage: pageFetcher(
			store,
			'groups',
			(request: GroupsPageRequest, params) =>
				api.findGroups(request.projectId, request.page, request.size, params),
			errors,
			{ merge: CumulativePageHelper.merge },
		),
		updateGroupsPageSearchParams: paramsUpdater(store, 'groups'),
		fetchGroupMembersPage: fetchGroupMembersPage(store, api, errors),
		updateGroupMembersPageSearchParams: paramsUpdater(store, 'members'),
		searchParticipants: searchParticipants(store, api, errors),
	})),
);
