import { WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, Params, provideRouter, Router, NavigationEnd } from '@angular/router'
import { filter, firstValueFrom, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { MovementsListPage } from '@pages/projects/[projectId]/movements/movements-list/movements-list.page'
import { MovementsListSearchModel } from '@pages/projects/[projectId]/movements/movements-list/movements-list.search'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub'

interface MovementsListApi {
    model: WritableSignal<MovementsListSearchModel>
    search: () => void
    resetFilters: () => void
}

describe('MovementsListPage', () => {
    let facade: Record<string, Mock>

    function create(query: Params = {}): MovementsListApi {
        facade = autoMock()
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                ...(Object.keys(query).length > 0 ? [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) }, queryParamMap: of(convertToParamMap(query)) } }] : []),
                REFRESH_SERVICE_STUB,
                { provide: MovementFacade, useValue: facade },
                { provide: SessionFacade, useValue: autoMock() },
            ],
        })
        TestBed.overrideComponent(MovementsListPage, { set: { template: '', imports: [], providers: [] } })
        return TestBed.createComponent(MovementsListPage).componentInstance as unknown as MovementsListApi
    }

    beforeEach(() => {
        TestBed.resetTestingModule()
    })

    it('starts from the default filters when the url carries none', () => {
        // Arrange
        // Act
        const page: MovementsListApi = create()

        // Assert
        expect(page.model()).toEqual({ type: '', from: null, to: null, isVisible: '' })
        expect(facade['fetchMovementsPage']).toHaveBeenCalledWith(undefined, undefined)
    })

    it('starts from the filters carried by the url', () => {
        // Arrange
        // Act
        const page: MovementsListApi = create({ type: 'IN', from: '2026-01-02T00:00:00.000Z' })

        // Assert
        expect(page.model()).toEqual({ type: 'IN', from: new Date('2026-01-02T00:00:00.000Z'), to: null, isVisible: '' })
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith('IN', new Date('2026-01-02T00:00:00.000Z'), undefined, undefined)
    })

    it('sends the typed filters to the facade, restarts from the first batch and writes the url', async () => {
        // Arrange
        const page: MovementsListApi = create()
        const router: Router = TestBed.inject(Router)
        page.model.set({ type: 'IN', from: null, to: null, isVisible: 'true' })

        const navigated: Promise<unknown> = firstValueFrom(router.events.pipe(filter((event: unknown): boolean => event instanceof NavigationEnd)))

        // Act
        page.search()
        await navigated

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith('IN', undefined, undefined, true)
        expect(facade['fetchMovementsPage']).toHaveBeenLastCalledWith(0, undefined)
        expect(router.url).toBe('/?type=IN&isVisible=true')
    })

    it('clears the filters when they are reset, then searches again', () => {
        // Arrange
        const page: MovementsListApi = create({ type: 'IN' })

        // Act
        page.resetFilters()

        // Assert
        expect(page.model()).toEqual({ type: '', from: null, to: null, isVisible: '' })
        expect(facade['fetchMovementsPage']).toHaveBeenLastCalledWith(0, undefined)
    })
})
