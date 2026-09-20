import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { AuthFacade } from '@core/auth/auth.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { HomeFacade } from '@pages/home/home.facade';
import { StringHelper } from '@shared/helpers/string.helper';
import { UserHelper } from '@shared/helpers/user.helper';
import { AttentionProjectModel } from '@shared/models/attention-project.model';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { ProjectSummaryModel } from '@shared/models/project-summary.model';
import { ReceivedInvitationModel } from '@shared/models/received-invitation.model';
import { UpcomingProjectModel } from '@shared/models/upcoming-project.model';
import { WatchedProjectModel } from '@shared/models/watched-project.model';
import { AttentionProjectsComponent } from '@shared/ui/attention-projects/attention-projects.component';
import { CreateProjectPromptComponent } from '@shared/ui/create-project-prompt/create-project-prompt.component';
import { FavoritesProjectsComponent } from '@shared/ui/favorites-projects/favorites-projects.component';
import { PageTitleComponent } from '@shared/ui/page-title/page-title.component';
import { ProjectsInProgressComponent } from '@shared/ui/projects-in-progress/projects-in-progress.component';
import { ReceivedInvitationsComponent } from '@shared/ui/received-invitations/received-invitations.component';
import { ShortcutsComponent } from '@shared/ui/shortcuts/shortcuts.component';
import { UpcomingProjectsComponent } from '@shared/ui/upcoming-projects/upcoming-projects.component';

/**
 * Which widget occupies the page's hero slot (first, full-width). Priority when favorites is empty:
 * projects in progress > upcoming projects > received invitations > the create-project prompt — see
 * HomePage.heroSlot.
 */
type HomeHeroSlot = 'favorites' | 'projectsInProgress' | 'upcoming' | 'invitations' | 'createProject';

@Component({
	imports: [
		TranslocoPipe,
		PageTitleComponent,
		ReceivedInvitationsComponent,
		ProjectsInProgressComponent,
		UpcomingProjectsComponent,
		AttentionProjectsComponent,
		CreateProjectPromptComponent,
		ShortcutsComponent,
		FavoritesProjectsComponent,
	],
	providers: [provideTranslocoScope('home')],
	templateUrl: './home.page.html',
	styleUrl: './home.page.less',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Purpose: Home dashboard route — greets the current user and renders favorite/watched/upcoming/attention
 * projects, received invitations, and shortcuts, reordering/resizing them based on which have content.
 * Scope: Reads AuthFacade for the greeting and HomeFacade for all dashboard data; triggers HomeFacade.loadAll() on init.
 * Limits: No fetching or state mutation of its own — every action is forwarded to HomeFacade.
 */
export class HomePage {
	private readonly _authFacade: AuthFacade = inject(AuthFacade);
	protected readonly homeFacade: HomeFacade = inject(HomeFacade);

	private readonly _currentUser: Signal<CurrentUserModel | undefined> = this._authFacade.currentUser;
	private readonly _isPersonalizedTitle: Signal<boolean> = computed(() => StringHelper.isNotBlank(this.displayName()));
	protected readonly displayName: Signal<string | undefined> = computed(() =>
		UserHelper.displayName(this._currentUser(), 'short'),
	);
	protected readonly titleKey: Signal<string | undefined> = computed(() => this._isPersonalizedTitle() ? 'home.helloUser' : 'home.hello');

	protected readonly favoritesProjects: Signal<ProjectSummaryModel[]> = this.homeFacade.favoritesProjects;
	protected readonly favoritesProjectsTotal: Signal<number> = this.homeFacade.favoritesProjectsTotal;
	protected readonly projectsInProgress: Signal<WatchedProjectModel[]> = this.homeFacade.projectsInProgress;
	protected readonly receivedInvitations: Signal<ReceivedInvitationModel[]> = this.homeFacade.receivedInvitations;
	protected readonly upcomingProjects: Signal<UpcomingProjectModel[]> = this.homeFacade.upcomingProjects;
	protected readonly attentionProjects: Signal<AttentionProjectModel[]> = this.homeFacade.attentionProjects;

	// Favorites is the default hero (unchanged from the historical layout) whenever it has content;
	// otherwise the first non-empty widget below wins the slot, and if none do, a create-project prompt
	// fills it instead of an empty hero.
	protected readonly favoritesEmpty: Signal<boolean> = computed(() => this.favoritesProjects().length === 0);
	protected readonly heroSlot: Signal<HomeHeroSlot> = computed(() => {
		if (this.favoritesProjects().length > 0) return 'favorites';
		if (this.projectsInProgress().length > 0) return 'projectsInProgress';
		if (this.upcomingProjects().length > 0) return 'upcoming';
		if (this.receivedInvitations().length > 0) return 'invitations';
		return 'createProject';
	});
	// The create-project prompt only ever appears because invitations is empty (that's what triggers it),
	// so showing an empty invitations widget right beside it would be redundant.
	protected readonly showInvitations: Signal<boolean> = computed(() => this.heroSlot() !== 'createProject');

	public constructor() {
		this.homeFacade.loadAll();
	}

	protected onFavoriteToggled(id: string): void {
		this.homeFacade.toggleFavorite(id);
	}

	protected onInvitationAccepted(id: string): void {
		this.homeFacade.acceptInvitation(id);
	}

	protected onInvitationRejected(id: string): void {
		this.homeFacade.rejectInvitation(id);
	}
}
