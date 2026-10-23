import { DebugElement, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco'
import { MockBuilder } from 'ng-mocks'
import { HomeFacade } from '@pages/home/data/state/home.facade'
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures'
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures'
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { ProjectMapper } from '@shared/mappers/project.mapper'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ProjectModel } from '@shared/models/model/project.model'
import { HomeFavoriteProjectsComponent } from './home-favorite-projects.component'
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';

function projects(count: number): ProjectModel[] {
	return Array.from({ length: count }, (_: unknown, index: number): ProjectModel => ({ ...ProjectMapper.toModel(PROJECT_DTO), id: `p${index}`, name: `Project ${index}` }))
}

describe('HomeFavoriteProjectsComponent', () => {
	let fixture: ComponentFixture<HomeFavoriteProjectsComponent>
	let favorites: WritableSignal<ProjectModel[]>
	let total: WritableSignal<number | undefined>
	let loading: WritableSignal<boolean>
	let error: WritableSignal<NotificationModel | undefined>
	let fetchFavorites: ReturnType<typeof vi.fn>
	let removeFavorite: ReturnType<typeof vi.fn>

	async function render(): Promise<void> {
		fixture = TestBed.createComponent(HomeFavoriteProjectsComponent)
		await fixture.whenStable()
	}

	beforeEach(async () => {
		favorites = signal<ProjectModel[]>([])
		total = signal<number | undefined>(undefined)
		loading = signal(false)
		error = signal<NotificationModel | undefined>(undefined)
		fetchFavorites = vi.fn()
		removeFavorite = vi.fn()
		await MockBuilder(HomeFavoriteProjectsComponent).provide(REFRESH_SERVICE_STUB)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.mock(CustomDateFormatPipe, (): string => 'date')
			.provide({ provide: TranslocoService, useValue: { translate: (key: string, params?: { count: number }): string => `${key}:${params?.count}`, getActiveLang: (): string => 'fr' } })
			.provide({
				provide: HomeFacade,
				useValue: { favorites, favoritesTotal: total, favoritesLoading: loading, favoritesError: error, fetchFavorites, removeFavorite },
			})
	})

	it('should load the favorites when displayed', async () => {
		// Arrange

		// Act
		await render()

		// Assert
		expect(fetchFavorites).toHaveBeenCalledTimes(1)
	})

	it('should show one card per favorite project', async () => {
		// Arrange
		favorites.set(projects(3))
		total.set(3)

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-tile').length).toBe(3)
	})

	it('should show a skeleton while the first load is running', async () => {
		// Arrange
		loading.set(true)

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-skeleton').length).toBe(3)
		expect(fixture.nativeElement.querySelector('sgdf-tile')).toBeNull()
	})

	it('should tell that there is no favorite', async () => {
		// Arrange
		total.set(0)

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.textContent).toContain('home.favorites.empty')
	})

	it('should show the section error and retry on demand', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500))
		await render()
		fetchFavorites.mockClear()

		// Act
		fixture.debugElement.query((element: DebugElement): boolean => element.name === 'app-section-error').triggerEventHandler('retry')

		// Assert
		expect(fetchFavorites).toHaveBeenCalledTimes(1)
	})

	it('should remove a project from the favorites', async () => {
		// Arrange
		favorites.set(projects(1))
		total.set(1)
		await render()

		// Act
		fixture.debugElement.query((element: DebugElement): boolean => element.name === 'app-favorite-toggle').triggerEventHandler('toggled')

		// Assert
		expect(removeFavorite).toHaveBeenCalledWith(favorites()[0])
	})

	it('should open the project in the app on a plain click and leave modified clicks to the browser', async () => {
		// Arrange
		favorites.set(projects(1))
		total.set(1)
		await render()
		const navigateByUrl: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue(true)
		;(fixture.componentInstance as unknown as { router: { navigateByUrl: unknown } }).router = { navigateByUrl }
		const tile: HTMLElement = fixture.nativeElement.querySelector('sgdf-tile')
		const plain: MouseEvent = new MouseEvent('click', { cancelable: true, bubbles: true })
		const modified: MouseEvent = new MouseEvent('click', { cancelable: true, bubbles: true, ctrlKey: true })

		// Act
		tile.dispatchEvent(plain)
		tile.dispatchEvent(modified)

		// Assert
		expect(navigateByUrl).toHaveBeenCalledTimes(1)
		expect(navigateByUrl).toHaveBeenCalledWith('/projects/p0')
		expect(plain.defaultPrevented).toBe(true)
		expect(modified.defaultPrevented).toBe(false)
	})

	describe('card content', () => {
		interface CardApi {
			summary(project: ProjectModel): string | undefined
			period(project: ProjectModel): { begin: string, end: string } | undefined
		}
		const api = (): CardApi => fixture.componentInstance as unknown as CardApi
		const withCounts = (vehicles: number | undefined | null): ProjectModel => ({ counts: { participants: 142, groups: 7, vehicles } } as unknown as ProjectModel)

		beforeEach(async () => {
			await render()
		})

		it('should sum up the participants and the vehicles', () => {
			// Arrange
			const project: ProjectModel = withCounts(18)

			// Act
			const summary: string | undefined = api().summary(project)

			// Assert
			expect(summary).toBe('home.favorites.participants.few:142 · home.favorites.vehicles.few:18')
		})

		it('should fall back on the groups when the project has no vehicle count', () => {
			// Arrange
			const withoutVehicles: ProjectModel = withCounts(null)
			const undefinedVehicles: ProjectModel = withCounts(undefined)

			// Act
			const nullSummary: string | undefined = api().summary(withoutVehicles)
			const undefinedSummary: string | undefined = api().summary(undefinedVehicles)

			// Assert
			expect(nullSummary).toBe('home.favorites.participants.few:142 · home.favorites.groups.few:7')
			expect(undefinedSummary).toContain('home.favorites.groups')
		})

		it('should give no summary without counts', () => {
			// Arrange
			const project: ProjectModel = {} as ProjectModel

			// Act
			const summary: string | undefined = api().summary(project)

			// Assert
			expect(summary).toBeUndefined()
		})

		it('should write the days of a period inside one month only once', () => {
			// Arrange
			const project: ProjectModel = { begin: { date: '2026-09-18' }, end: { date: '2026-09-27' } } as unknown as ProjectModel

			// Act
			const period: { begin: string, end: string } | undefined = api().period(project)

			// Assert
			expect(period).toEqual({ begin: '18', end: '27 septembre 2026' })
		})

		it('should keep the month of the start when the period crosses months of one year', () => {
			// Arrange
			const project: ProjectModel = { begin: { date: '2026-09-28' }, end: { date: '2026-10-02' } } as unknown as ProjectModel

			// Act
			const period: { begin: string, end: string } | undefined = api().period(project)

			// Assert
			expect(period).toEqual({ begin: '28 septembre', end: '2 octobre 2026' })
		})

		it('should open the missing bound of a period and give none for a permanent project', () => {
			// Arrange
			const openEnded: ProjectModel = { begin: { date: '2026-09-18' } } as unknown as ProjectModel
			const permanent: ProjectModel = {} as ProjectModel

			// Act
			const openEndedPeriod: { begin: string, end: string } | undefined = api().period(openEnded)
			const permanentPeriod: { begin: string, end: string } | undefined = api().period(permanent)

			// Assert
			expect(openEndedPeriod).toEqual({ begin: '18 septembre 2026', end: '...' })
			expect(permanentPeriod).toBeUndefined()
		})
	})
})
