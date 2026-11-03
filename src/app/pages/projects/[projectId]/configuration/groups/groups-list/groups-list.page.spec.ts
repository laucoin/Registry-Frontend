import { WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, Params, provideRouter, Router, NavigationEnd } from '@angular/router'
import { filter, firstValueFrom, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade'
import { GroupsListPage } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.page'
import { GroupsListSearchModel } from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.search'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub'

interface GroupsListApi {
    model: WritableSignal<GroupsListSearchModel>
    search: () => void
    resetFilters: () => void
}

describe('GroupsListPage', () => {
    let facade: Record<string, Mock>

    function create(query: Params = {}): GroupsListApi {
        facade = autoMock()
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                ...(Object.keys(query).length > 0 ? [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) }, queryParamMap: of(convertToParamMap(query)) } }] : []),
                REFRESH_SERVICE_STUB,
                { provide: GroupFacade, useValue: facade },
                { provide: SessionFacade, useValue: autoMock() },
            ],
        })
        TestBed.overrideComponent(GroupsListPage, { set: { template: '', imports: [], providers: [] } })
        return TestBed.createComponent(GroupsListPage).componentInstance as unknown as GroupsListApi
    }

    beforeEach(() => {
        TestBed.resetTestingModule()
    })

    it('starts from the default filters when the url carries none', () => {
        // Arrange
        // Act
        const page: GroupsListApi = create()

        // Assert
        expect(page.model()).toEqual({ q: '', at: null, isPresent: '', isVisible: '', sortBy: '', sortDirection: 'asc' })
        expect(facade['fetchGroupsPage']).toHaveBeenCalledWith(undefined, undefined)
    })

    it('starts from the filters carried by the url', () => {
        // Arrange
        // Act
        const page: GroupsListApi = create({ q: 'ada', isPresent: 'true' })

        // Assert
        expect(page.model()).toEqual({ q: 'ada', at: null, isPresent: 'true', isVisible: '', sortBy: '', sortDirection: 'asc' })
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith('ada', undefined, true, undefined, undefined)
    })

    it('sends the typed filters to the facade, restarts from the first batch and writes the url', async () => {
        // Arrange
        const page: GroupsListApi = create()
        const router: Router = TestBed.inject(Router)
        page.model.set({ q: 'camp', at: null, isPresent: '', isVisible: '', sortBy: '', sortDirection: 'asc' })

        const navigated: Promise<unknown> = firstValueFrom(router.events.pipe(filter((event: unknown): boolean => event instanceof NavigationEnd)))

        // Act
        page.search()
        await navigated

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith('camp', undefined, undefined, undefined, undefined)
        expect(facade['fetchGroupsPage']).toHaveBeenLastCalledWith(0, undefined)
        expect(router.url).toBe('/?q=camp')
    })

    it('clears the filters when they are reset, then searches again', () => {
        // Arrange
        const page: GroupsListApi = create({ q: 'ada', isPresent: 'true' })

        // Act
        page.resetFilters()

        // Assert
        expect(page.model()).toEqual({ q: '', at: null, isPresent: '', isVisible: '', sortBy: '', sortDirection: 'asc' })
        expect(facade['fetchGroupsPage']).toHaveBeenLastCalledWith(0, undefined)
    })
})
