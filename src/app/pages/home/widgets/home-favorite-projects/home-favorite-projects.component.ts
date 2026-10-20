import '@sgdf/ui/tag'
import '@sgdf/ui/tile'
import '@sgdf/ui/icon'
import '@sgdf/ui/button'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/relative-time'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit, Signal } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { provideTranslocoScope, TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { HomeFacade } from '@pages/home/data/state/home.facade'
import { DateHelper } from '@shared/helpers/date.helper'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { injectAutoRefresh } from '@shared/helpers/refresh/inject-auto-refresh'

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
	imports: [TranslocoPipe, PluralTranslationPipe, RouterLink, SectionErrorComponent, FavoriteToggleComponent],
	templateUrl: './home-favorite-projects.component.html',
})
export class HomeFavoriteProjectsComponent implements OnInit {
	private readonly facade: HomeFacade = inject(HomeFacade)
	private readonly autoRefresh: void = injectAutoRefresh('home/favorites', 'counts', (): void => this.facade.refreshFavorites())
	private readonly router: Router = inject(Router)
	private readonly translocoService: TranslocoService = inject(TranslocoService)

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
		return `/${RegistryRouteEnum.PROJECT.replace(':projectId', project.id)}`
	}

	protected open(event: MouseEvent, project: ProjectModel): void {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return
		}
		event.preventDefault()
		this.router.navigateByUrl(this.link(project)).catch((error: Error): void => console.error(error))
	}

	protected summary(project: ProjectModel): string | undefined {
		const counts: ProjectModel['counts'] = project.counts
		if (!counts) {
			return undefined
		}
		const participants: string = this.translocoService.translate(this.pluralKey('home.favorites.participants', counts.participants), { count: counts.participants })
		const vehicles: number | undefined = counts.vehicles ?? undefined
		const other: string = vehicles !== undefined
			? this.translocoService.translate(this.pluralKey('home.favorites.vehicles', vehicles), { count: vehicles })
			: this.translocoService.translate(this.pluralKey('home.favorites.groups', counts.groups), { count: counts.groups })
		return `${participants} · ${other}`
	}

	protected period(project: ProjectModel): { begin: string, end: string } | undefined {
		const begin: Date | undefined = DateHelper.toDate(project.begin)
		const end: Date | undefined = DateHelper.toDate(project.end)
		if (!begin && !end) {
			return undefined
		}
		const locale: string = this.translocoService.getActiveLang()
		const full: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
		const dayAndMonth: Intl.DateTimeFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' })
		if (!begin || !end) {
			return { begin: begin ? full.format(begin) : '...', end: end ? full.format(end) : '...' }
		}
		const sameYear: boolean = begin.getFullYear() === end.getFullYear()
		const sameMonth: boolean = sameYear && begin.getMonth() === end.getMonth()
		return {
			begin: sameMonth ? String(begin.getDate()) : sameYear ? dayAndMonth.format(begin) : full.format(begin),
			end: full.format(end),
		}
	}

	private pluralKey(key: string, count: number): string {
		return `${key}.${count === 0 || count === 1 ? 'one' : 'few'}`
	}

	protected initials(project: ProjectModel): string {
		const words: string[] = project.name.trim().split(/\s+/)
		const letters: string = words.length > 1 ? words.slice(0, INITIALS_LENGTH).map((word: string): string => word[0]).join('') : words[0].slice(0, INITIALS_LENGTH)
		return letters.toUpperCase()
	}
}
