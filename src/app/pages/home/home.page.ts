import { ChangeDetectionStrategy, Component, computed, inject, Signal } from '@angular/core';
import { AuthFacade } from '@core/auth/auth.facade';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { HomeFacade } from '@pages/home/home.facade';
import { StringHelper } from '@shared/helpers/string.helper';
import { UserHelper } from '@shared/helpers/user.helper';
import { CurrentUserModel } from '@shared/models/current-user.model';
import { ProjectProfileModel } from '@shared/models/project-profile.model';
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
 * Purpose: Home dashboard route — greets the current user and renders favorite/in-progress/upcoming/attention
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

	protected readonly favoritesProjects: Signal<ProjectProfileModel[]> = this.homeFacade.favoritesProjects;
	protected readonly favoritesProjectsTotal: Signal<number> = this.homeFacade.favoritesProjectsTotal;
	protected readonly projectsInProgress: Signal<ProjectProfileModel[]> = this.homeFacade.projectsInProgress;
	protected readonly receivedInvitations: Signal<ProjectProfileModel[]> = this.homeFacade.receivedInvitations;
	protected readonly upcomingProjects: Signal<ProjectProfileModel[]> = this.homeFacade.upcomingProjects;
	protected readonly attentionProjects: Signal<ProjectProfileModel[]> = this.homeFacade.attentionProjects;

	// Favorites is the default hero (unchanged from the historical layout) whenever it has content;
	// otherwise the first non-empty widget below wins the slot, in this fixed order, and if none do,
	// a create-project prompt fills it instead of an empty hero.
	private readonly _heroPriority: Signal<{ slot: HomeHeroSlot; hasContent: boolean }[]> = computed(() => [
		{ slot: 'favorites', hasContent: this.favoritesProjects().length > 0 },
		{ slot: 'projectsInProgress', hasContent: this.projectsInProgress().length > 0 },
		{ slot: 'upcoming', hasContent: this.upcomingProjects().length > 0 },
		{ slot: 'invitations', hasContent: this.receivedInvitations().length > 0 },
	]);
	protected readonly favoritesEmpty: Signal<boolean> = computed(() => this.favoritesProjects().length === 0);
	protected readonly heroSlot: Signal<HomeHeroSlot> = computed(
		() => this._heroPriority().find(candidate => candidate.hasContent)?.slot ?? 'createProject',
	);
	// The create-project prompt only ever appears because every other widget is empty (that's what
	// triggers it), so showing them empty right beside it would just be redundant clutter.
	protected readonly showSecondaryWidgets: Signal<boolean> = computed(() => this.heroSlot() !== 'createProject');

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
