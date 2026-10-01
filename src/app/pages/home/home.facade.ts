import { inject, Injectable, Signal } from '@angular/core';
import { HomeStore } from '@pages/home/home.store';
import { ProjectProfileModel } from '@shared/models/project-profile.model';
import { ProjectModel } from '@shared/models/project.model';

/**
 * Purpose: Sole public entry point for the home page's own domain data — favorites/in-progress/upcoming/attention
 * projects, invitations.
 * Scope: Exposes HomeStore's state as signals and forwards every load/toggle/accept/reject call to it.
 * Limits: Implements no HTTP or state logic itself; only orchestrates HomeStore.
 */
@Injectable({ providedIn: 'root' })
export class HomeFacade {
	private readonly _store: InstanceType<typeof HomeStore> = inject(HomeStore);

	public readonly favoritesProjects: Signal<ProjectProfileModel[]> = this._store.favoritesProjects;
	public readonly favoritesProjectsTotal: Signal<number> = this._store.favoritesProjectsTotal;
	public readonly projectsInProgress: Signal<ProjectProfileModel[]> = this._store.projectsInProgress;
	public readonly receivedInvitations: Signal<ProjectProfileModel[]> = this._store.receivedInvitations;
	public readonly upcomingProjects: Signal<ProjectProfileModel[]> = this._store.upcomingProjects;
	public readonly attentionProjects: Signal<ProjectModel[]> = this._store.attentionProjects;

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
