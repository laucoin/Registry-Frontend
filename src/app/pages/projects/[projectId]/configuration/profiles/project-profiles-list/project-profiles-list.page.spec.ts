import { WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, Params, provideRouter, Router, NavigationEnd } from '@angular/router'
import { filter, firstValueFrom, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade'
import { ProjectProfilesListPage } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.page'
import { ProjectProfilesListSearchModel } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.search'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub'

interface ProjectProfilesListApi {
    model: WritableSignal<ProjectProfilesListSearchModel>
    search: () => void
    resetFilters: () => void
}

describe('ProjectProfilesListPage', () => {
    let facade: Record<string, Mock>

    function create(query: Params = {}): ProjectProfilesListApi {
        facade = autoMock()
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                ...(Object.keys(query).length > 0 ? [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) }, queryParamMap: of(convertToParamMap(query)) } }] : []),
                REFRESH_SERVICE_STUB,
                { provide: ProjectProfileFacade, useValue: facade },
                { provide: SessionFacade, useValue: autoMock() },
            ],
        })
        TestBed.overrideComponent(ProjectProfilesListPage, { set: { template: '', imports: [], providers: [] } })
        return TestBed.createComponent(ProjectProfilesListPage).componentInstance as unknown as ProjectProfilesListApi
    }

    beforeEach(() => {
        TestBed.resetTestingModule()
    })

    it('starts from the default filters when the url carries none', () => {
        // Arrange
        // Act
        const page: ProjectProfilesListApi = create()

        // Assert
        expect(page.model()).toEqual({ q: '', at: null, status: '', isAvailable: '', isVisible: '', sortBy: '', sortDirection: 'asc' })
        expect(facade['fetchProjectProfilesPage']).toHaveBeenCalledWith(undefined, undefined)
    })

    it('starts from the filters carried by the url', () => {
        // Arrange
        // Act
        const page: ProjectProfilesListApi = create({ q: 'ada', status: 'ACTIVE' })

        // Assert
        expect(page.model()).toEqual({ q: 'ada', at: null, status: 'ACTIVE', isAvailable: '', isVisible: '', sortBy: '', sortDirection: 'asc' })
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith('ada', undefined, 'ACTIVE', undefined, undefined, undefined)
    })

    it('sends the typed filters to the facade, restarts from the first batch and writes the url', async () => {
        // Arrange
        const page: ProjectProfilesListApi = create()
        const router: Router = TestBed.inject(Router)
        page.model.set({ q: 'camp', at: null, status: '', isAvailable: '', isVisible: '', sortBy: '', sortDirection: 'asc' })

        const navigated: Promise<unknown> = firstValueFrom(router.events.pipe(filter((event: unknown): boolean => event instanceof NavigationEnd)))

        // Act
        page.search()
        await navigated

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith('camp', undefined, undefined, undefined, undefined, undefined)
        expect(facade['fetchProjectProfilesPage']).toHaveBeenLastCalledWith(0, undefined)
        expect(router.url).toBe('/?q=camp')
    })

    it('clears the filters when they are reset, then searches again', () => {
        // Arrange
        const page: ProjectProfilesListApi = create({ q: 'ada', status: 'ACTIVE' })

        // Act
        page.resetFilters()

        // Assert
        expect(page.model()).toEqual({ q: '', at: null, status: '', isAvailable: '', isVisible: '', sortBy: '', sortDirection: 'asc' })
        expect(facade['fetchProjectProfilesPage']).toHaveBeenLastCalledWith(0, undefined)
    })
})
