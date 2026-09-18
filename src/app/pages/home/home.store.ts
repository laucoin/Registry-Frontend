import { inject } from '@angular/core';
import { ProfilesApi } from '@core/profiles/profiles.api';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { PageResponse } from '@shared/mappers/common/page.response';
import { ProjectProfileMapper, ProjectProfileResponse } from '@shared/mappers/project-profile.mapper';
import { ProjectProfileModel } from '@shared/models/project-profile.model';
import { catchError, EMPTY, map, pipe, switchMap, tap } from 'rxjs';

const RECENT_PROJECTS_SIZE: number = 5;
const PROJECTS_TO_WATCH_SIZE: number = 5;
const RECEIVED_INVITATIONS_SIZE: number = 5;
const UPCOMING_PROJECTS_SIZE: number = 5;
const ATTENTION_PROJECTS_LIMIT: number = 5;

interface HomeState {
	favoritesProjects: ProjectProfileModel[];
	favoritesProjectsTotal: number;
	projectsInProgress: ProjectProfileModel[];
	receivedInvitations: ProjectProfileModel[];
	upcomingProjects: ProjectProfileModel[];
	attentionProjects: ProjectProfileModel[];
}

const initialState: HomeState = {
	favoritesProjects: [],
	favoritesProjectsTotal: 0,
	projectsInProgress: [],
	receivedInvitations: [],
	upcomingProjects: [],
	attentionProjects: [],
};

function toModels(page: PageResponse<ProjectProfileResponse>): ProjectProfileModel[] {
	return page.content.map(ProjectProfileMapper.toModel);
}

function toggleFavoriteIn(projects: ProjectProfileModel[], id: string): ProjectProfileModel[] {
	return projects.map((project: ProjectProfileModel) =>
		project.id === id ? { ...project, isFavorite: !project.isFavorite } : project,
	);
}

/**
 * Purpose: Holds the home page's shared dashboard state (favorites/in-progress projects, received invitations)
 * and the operations that mutate it.
 * Scope: Calls ProfilesApi with this page's own filters/sizes and maps each response to ProjectProfileModel;
 * patches local state optimistically for favorite-toggle/invitation actions.
 * Limits: Never injected directly outside HomeFacade; scoped to the home page's own data only.
 */
export const HomeStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => {
		const profilesApi: ProfilesApi = inject(ProfilesApi);

		function removeInvitation(id: string): void {
			patchState(store, {
				receivedInvitations: store
					.receivedInvitations()
					.filter((invitation: ProjectProfileModel) => invitation.id !== id),
			});
		}

		function fetchFavoritesProjects() {
			return profilesApi.findProfiles({
				status: 'ACCEPTED',
				favorite: true,
				size: RECENT_PROJECTS_SIZE,
				sort: 'LAST_MODIFIED_DATE',
				direction: 'DESC',
			});
		}

		return {
			loadFavoritesProjects: rxMethod<void>(
				pipe(
					switchMap(() => fetchFavoritesProjects().pipe(catchError(() => EMPTY))),
					tap((page: PageResponse<ProjectProfileResponse>): void =>
						patchState(store, {
							favoritesProjects: toModels(page),
							favoritesProjectsTotal: page.totalElements,
						}),
					),
				),
			),

			loadProjectsInProgress: rxMethod<void>(
				pipe(
					switchMap(() =>
						profilesApi
							.findProfiles({ status: 'ACCEPTED', available: true, size: PROJECTS_TO_WATCH_SIZE })
							.pipe(map(toModels), catchError(() => EMPTY)),
					),
					tap((projectsInProgress: ProjectProfileModel[]): void => patchState(store, { projectsInProgress })),
				),
			),

			loadReceivedInvitations: rxMethod<void>(
				pipe(
					switchMap(() =>
						profilesApi
							.findProfiles({ status: 'INVITED', size: RECEIVED_INVITATIONS_SIZE })
							.pipe(map(toModels), catchError(() => EMPTY)),
					),
					tap((receivedInvitations: ProjectProfileModel[]): void =>
						patchState(store, { receivedInvitations }),
					),
				),
			),

			loadUpcomingProjects: rxMethod<void>(
				pipe(
					switchMap(() =>
						profilesApi
							.findProfiles({ status: 'ACCEPTED', upcoming: true, size: UPCOMING_PROJECTS_SIZE })
							.pipe(map(toModels), catchError(() => EMPTY)),
					),
					tap((upcomingProjects: ProjectProfileModel[]): void => patchState(store, { upcomingProjects })),
				),
			),

			loadProjectsRequiringAttention: rxMethod<void>(
				pipe(
					switchMap(() =>
						profilesApi.findProfilesRequiringAttention(ATTENTION_PROJECTS_LIMIT).pipe(
							map((response: ProjectProfileResponse[]) => response.map(ProjectProfileMapper.toModel)),
							catchError(() => EMPTY),
						),
					),
					tap((attentionProjects: ProjectProfileModel[]): void => patchState(store, { attentionProjects })),
				),
			),

			toggleFavorite: rxMethod<string>(
				pipe(
					switchMap((id: string) =>
						profilesApi.toggleFavorite(id).pipe(
							tap((): void =>
								patchState(store, {
									projectsInProgress: toggleFavoriteIn(store.projectsInProgress(), id),
									upcomingProjects: toggleFavoriteIn(store.upcomingProjects(), id),
									attentionProjects: toggleFavoriteIn(store.attentionProjects(), id),
								}),
							),
							// Unlike the three lists above, favoritesProjects' membership (not just its isFavorite
							// flag) IS the favorite status, sorted server-side by last-modified — a local flip
							// can't add/remove/reorder it correctly, so re-fetch it instead.
							switchMap(() => fetchFavoritesProjects()),
							tap((page: PageResponse<ProjectProfileResponse>): void =>
								patchState(store, {
									favoritesProjects: toModels(page),
									favoritesProjectsTotal: page.totalElements,
								}),
							),
							catchError(() => EMPTY),
						),
					),
				),
			),

			acceptInvitation: rxMethod<string>(
				pipe(
					switchMap((id: string) =>
						profilesApi.acceptInvitation(id).pipe(
							tap((): void => removeInvitation(id)),
							catchError(() => EMPTY),
						),
					),
				),
			),

			rejectInvitation: rxMethod<string>(
				pipe(
					switchMap((id: string) =>
						profilesApi.rejectInvitation(id).pipe(
							tap((): void => removeInvitation(id)),
							catchError(() => EMPTY),
						),
					),
				),
			),
		};
	}),
);
