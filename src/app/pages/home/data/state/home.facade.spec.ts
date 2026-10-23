import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { UiFacade } from '@core/registry/state/ui.facade'
import { HomeStore } from '@pages/home/data/state/home.store'
import { ProjectApi } from '@pages/projects/data/state/project.api'
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures'
import { ProjectMapper } from '@shared/mappers/project.mapper'
import { ProjectModel } from '@shared/models/model/project.model'
import { MockBuilder } from 'ng-mocks'
import { HomeFacade } from './home.facade'

function project(id: string, activeAlerts: number | undefined): ProjectModel {
	return { ...ProjectMapper.toModel(PROJECT_DTO), id, counts: { participants: 1, groups: 1, acceptedProfiles: 1, vehicles: undefined, activities: undefined, activeAlerts } }
}

describe('HomeFacade', () => {
	let facade: HomeFacade
	let fetchFavorites: ReturnType<typeof vi.fn>
	let fetchAttention: ReturnType<typeof vi.fn>
	let setFavoriteById: ReturnType<typeof vi.fn>

	beforeEach(async () => {
		fetchFavorites = vi.fn()
		fetchAttention = vi.fn()
		setFavoriteById = vi.fn().mockReturnValue(of(undefined))
		const page = (content: ProjectModel[]): WritableSignal<{ content: ProjectModel[], totalElements: number }> => signal({ content, totalElements: content.length })
		await MockBuilder(HomeFacade)
			.provide({
				provide: HomeStore,
				useValue: {
					favorites: { element: page([project('a', 0)]), loading: signal(false), error: signal(undefined) },
					attention: { element: page([project('b', 3), project('c', 0), project('d', undefined)]), loading: signal(false), error: signal(undefined) },
					fetchFavorites,
					fetchAttention,
				},
			})
			.provide({ provide: ProjectApi, useValue: { setFavoriteById } })
			.provide({ provide: UiFacade, useValue: { notify: vi.fn() } })
		facade = TestBed.inject(HomeFacade)
	})

	it('should keep only the projects with an active alert in the attention list', () => {
		expect(facade.attention().map((item: ProjectModel): string => item.id)).toEqual(['b'])
	})

	it('should request a small first page of favorites and of alerted projects', () => {
		facade.fetchFavorites()
		facade.fetchAttention()

		expect(fetchFavorites).toHaveBeenCalledWith({ page: 0, size: 3 })
		expect(fetchAttention).toHaveBeenCalledWith({ page: 0, size: 5 })
	})

	it('should remove a favorite then reload the favorites', () => {
		facade.removeFavorite(project('a', 0))

		expect(setFavoriteById).toHaveBeenCalledWith('a', false)
		expect(fetchFavorites).toHaveBeenCalledTimes(1)
	})
})
