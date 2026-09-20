import { inject, Injectable, Signal } from '@angular/core';
import { HomeStore } from '@pages/home/home.store';
import { AttentionProjectModel } from '@shared/models/attention-project.model';
import { ProjectSummaryModel } from '@shared/models/project-summary.model';
import { ReceivedInvitationModel } from '@shared/models/received-invitation.model';
import { UpcomingProjectModel } from '@shared/models/upcoming-project.model';
import { WatchedProjectModel } from '@shared/models/watched-project.model';

/**
 * Purpose: Sole public entry point for the home page's own domain data — recent/watched/upcoming/attention
 * projects, invitations.
 * Scope: Exposes HomeStore's state as signals and forwards every load/toggle/accept/reject call to it.
 * Limits: Implements no HTTP or state logic itself; only orchestrates HomeStore.
 */
@Injectable({ providedIn: 'root' })
export class HomeFacade {
	private readonly _store: InstanceType<typeof HomeStore> = inject(HomeStore);

	public readonly favoritesProjects: Signal<ProjectSummaryModel[]> = this._store.favoritesProjects;
	public readonly favoritesProjectsTotal: Signal<number> = this._store.favoritesProjectsTotal;
	public readonly projectsInProgress: Signal<WatchedProjectModel[]> = this._store.projectsInProgress;
	public readonly receivedInvitations: Signal<ReceivedInvitationModel[]> = this._store.receivedInvitations;
	public readonly upcomingProjects: Signal<UpcomingProjectModel[]> = this._store.upcomingProjects;
	public readonly attentionProjects: Signal<AttentionProjectModel[]> = this._store.attentionProjects;

	public loadAll(): void {
		this._store.loadFavoritesProjects();
		this._store.loadProjectsInProgress();
		this._store.loadReceivedInvitations();
		this._store.loadUpcomingProjects();
		this._store.loadProjectsRequiringAttention();
	}

	public toggleFavorite(id: string): void {
		this._store.toggleFavorite(id);
	}

	public acceptInvitation(id: string): void {
		this._store.acceptInvitation(id);
	}

	public rejectInvitation(id: string): void {
		this._store.rejectInvitation(id);
	}
}
