import { DebugElement, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoPipe } from '@jsverse/transloco'
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
		await MockBuilder(HomeFavoriteProjectsComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.mock(CustomDateFormatPipe, (): string => 'date')
			.provide({
				provide: HomeFacade,
				useValue: { favorites, favoritesTotal: total, favoritesLoading: loading, favoritesError: error, fetchFavorites, removeFavorite },
			})
	})

	it('should load the favorites when displayed', async () => {
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
		expect(fixture.nativeElement.querySelectorAll('sgdf-card').length).toBe(3)
	})

	it('should show a skeleton while the first load is running', async () => {
		// Arrange
		loading.set(true)

		// Act
		await render()

		// Assert
		expect(fixture.nativeElement.querySelectorAll('sgdf-skeleton').length).toBe(3)
		expect(fixture.nativeElement.querySelector('sgdf-card')).toBeNull()
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
})
