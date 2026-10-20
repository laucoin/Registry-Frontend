import '@sgdf/ui/card'
import '@sgdf/ui/avatar'
import '@sgdf/ui/tag'
import '@sgdf/ui/icon'
import '@sgdf/ui/button'
import '@sgdf/ui/skeleton'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { HomeFacade } from '@pages/home/data/state/home.facade'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'

const INITIALS_LENGTH: number = 3

/**
 * Purpose: Shows the favorite projects of the signed-in user on the home page.
 * Scope: Loads the first favorites, shows each as a card with its counts and period, and removes a project from the favorites.
 * Limits: Reads the home facade only; it shows a few cards and links to the project list for the others.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-home-favorite-projects',
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	providers: [provideTranslocoScope('home')],
	imports: [TranslocoPipe, PluralTranslationPipe, CustomDateFormatPipe, RouterLink, SectionErrorComponent, FavoriteToggleComponent],
	templateUrl: './home-favorite-projects.component.html',
})
export class HomeFavoriteProjectsComponent implements OnInit {
	private readonly facade: HomeFacade = inject(HomeFacade)

	protected readonly projects: Signal<ProjectModel[]> = this.facade.favorites
	protected readonly total: Signal<number | undefined> = this.facade.favoritesTotal
	protected readonly loading: Signal<boolean> = this.facade.favoritesLoading
	protected readonly error: Signal<NotificationModel | undefined> = this.facade.favoritesError
	protected readonly projectsLink: string = RegistryRouteEnum.PROJECTS
	protected readonly skeletonCards: readonly number[] = [1, 2, 3]
	protected readonly showSkeleton: Signal<boolean> = computed((): boolean => this.loading() && this.total() === undefined)

	public ngOnInit(): void {
		this.reload()
	}

	protected reload(): void {
		this.facade.fetchFavorites()
	}

	protected remove(project: ProjectModel): void {
		this.facade.removeFavorite(project)
	}

	protected link(project: ProjectModel): string {
		return RegistryRouteEnum.PROJECT.replace(':projectId', project.id)
	}

	protected initials(project: ProjectModel): string {
		const words: string[] = project.name.trim().split(/\s+/)
		const letters: string = words.length > 1 ? words.slice(0, INITIALS_LENGTH).map((word: string): string => word[0]).join('') : words[0].slice(0, INITIALS_LENGTH)
		return letters.toUpperCase()
	}
}
