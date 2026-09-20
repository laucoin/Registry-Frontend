import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { FavoritesProjectsPage, HomeApi } from '@pages/home/home.api';
import { AttentionProjectModel } from '@shared/models/attention-project.model';
import { ProjectSummaryModel } from '@shared/models/project-summary.model';
import { ReceivedInvitationModel } from '@shared/models/received-invitation.model';
import { UpcomingProjectModel } from '@shared/models/upcoming-project.model';
import { WatchedProjectModel } from '@shared/models/watched-project.model';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';

interface HomeState {
	favoritesProjects: ProjectSummaryModel[];
	favoritesProjectsTotal: number;
	projectsInProgress: WatchedProjectModel[];
	receivedInvitations: ReceivedInvitationModel[];
	upcomingProjects: UpcomingProjectModel[];
	attentionProjects: AttentionProjectModel[];
}

const initialState: HomeState = {
	favoritesProjects: [],
	favoritesProjectsTotal: 0,
	projectsInProgress: [],
	receivedInvitations: [],
	upcomingProjects: [],
	attentionProjects: [],
};

/**
 * Purpose: Holds the home page's shared dashboard state (recent/watched projects, received invitations)
 * and the operations that mutate it.
 * Scope: Calls HomeApi and patches local state optimistically for favorite-toggle/invitation actions.
 * Limits: Never injected directly outside HomeFacade; scoped to the home page's own data only.
 */
export const HomeStore = signalStore(
	{ providedIn: 'root' },
	withState(initialState),
	withMethods((store) => {
		const homeApi: HomeApi = inject(HomeApi);

		function removeInvitation(id: string): void {
			patchState(store, {
				receivedInvitations: store
					.receivedInvitations()
					.filter((invitation: ReceivedInvitationModel) => invitation.id !== id),
			});
		}

		return {
			loadFavoritesProjects: rxMethod<void>(
				pipe(
					switchMap(() => homeApi.findFavoritesProjects().pipe(catchError(() => EMPTY))),
					tap((page: FavoritesProjectsPage): void =>
						patchState(store, { favoritesProjects: page.projects, favoritesProjectsTotal: page.total }),
					),
				),
			),

			loadProjectsInProgress: rxMethod<void>(
				pipe(
					switchMap(() => homeApi.findProjectsInProgress().pipe(catchError(() => EMPTY))),
					tap((projectsInProgress: WatchedProjectModel[]): void => patchState(store, { projectsInProgress })),
				),
			),

			loadReceivedInvitations: rxMethod<void>(
				pipe(
					switchMap(() => homeApi.findReceivedInvitations().pipe(catchError(() => EMPTY))),
					tap((receivedInvitations: ReceivedInvitationModel[]): void =>
						patchState(store, { receivedInvitations }),
					),
				),
			),

			loadUpcomingProjects: rxMethod<void>(
				pipe(
					switchMap(() => homeApi.findUpcomingProjects().pipe(catchError(() => EMPTY))),
					tap((upcomingProjects: UpcomingProjectModel[]): void => patchState(store, { upcomingProjects })),
				),
			),

			loadProjectsRequiringAttention: rxMethod<void>(
				pipe(
					switchMap(() => homeApi.findProjectsRequiringAttention().pipe(catchError(() => EMPTY))),
					tap((attentionProjects: AttentionProjectModel[]): void => patchState(store, { attentionProjects })),
				),
			),

			toggleFavorite: rxMethod<string>(
				pipe(
					switchMap((id: string) =>
						homeApi.toggleFavorite(id).pipe(
							tap((): void =>
								patchState(store, {
									favoritesProjects: store
										.favoritesProjects()
										.map((project: ProjectSummaryModel) =>
											project.id === id ? { ...project, isFavorite: !project.isFavorite } : project,
										),
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
						homeApi.acceptInvitation(id).pipe(
							tap((): void => removeInvitation(id)),
							catchError(() => EMPTY),
						),
					),
				),
			),

			rejectInvitation: rxMethod<string>(
				pipe(
					switchMap((id: string) =>
						homeApi.rejectInvitation(id).pipe(
							tap((): void => removeInvitation(id)),
							catchError(() => EMPTY),
						),
					),
				),
			),
		};
	}),
);
