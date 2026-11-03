import { WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, Params, provideRouter, Router, NavigationEnd } from '@angular/router'
import { filter, firstValueFrom, of } from 'rxjs'
import { Mock, beforeEach, describe, expect, it } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehiclesListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.page'
import { VehiclesListSearchModel } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.search'
import { autoMock } from '@shared/helpers/testing/auto-mock'
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub'

interface VehiclesListApi {
    model: WritableSignal<VehiclesListSearchModel>
    search: () => void
    resetFilters: () => void
}

describe('VehiclesListPage', () => {
    let facade: Record<string, Mock>

    function create(query: Params = {}): VehiclesListApi {
        facade = autoMock()
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                ...(Object.keys(query).length > 0 ? [{ provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) }, queryParamMap: of(convertToParamMap(query)) } }] : []),
                REFRESH_SERVICE_STUB,
                { provide: VehicleFacade, useValue: facade },
                { provide: SessionFacade, useValue: autoMock() },
            ],
        })
        TestBed.overrideComponent(VehiclesListPage, { set: { template: '', imports: [], providers: [] } })
        return TestBed.createComponent(VehiclesListPage).componentInstance as unknown as VehiclesListApi
    }

    beforeEach(() => {
        TestBed.resetTestingModule()
    })

    it('starts from the default filters when the url carries none', () => {
        // Arrange
        // Act
        const page: VehiclesListApi = create()

        // Assert
        expect(page.model()).toEqual({ q: '', at: null, status: '', isVisible: '' })
        expect(facade['fetchVehiclesPage']).toHaveBeenCalledWith(undefined, undefined)
    })

    it('starts from the filters carried by the url', () => {
        // Arrange
        // Act
        const page: VehiclesListApi = create({ q: 'ada', status: 'AVAILABLE' })

        // Assert
        expect(page.model()).toEqual({ q: 'ada', at: null, status: 'AVAILABLE', isVisible: '' })
        expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith('ada', undefined, 'AVAILABLE', undefined)
    })

    it('sends the typed filters to the facade, restarts from the first batch and writes the url', async () => {
        // Arrange
        const page: VehiclesListApi = create()
        const router: Router = TestBed.inject(Router)
        page.model.set({ q: 'camp', at: null, status: '', isVisible: '' })

        const navigated: Promise<unknown> = firstValueFrom(router.events.pipe(filter((event: unknown): boolean => event instanceof NavigationEnd)))

        // Act
        page.search()
        await navigated

        // Assert
        expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith('camp', undefined, undefined, undefined)
        expect(facade['fetchVehiclesPage']).toHaveBeenLastCalledWith(0, undefined)
        expect(router.url).toBe('/?q=camp')
    })

    it('clears the filters when they are reset, then searches again', () => {
        // Arrange
        const page: VehiclesListApi = create({ q: 'ada', status: 'AVAILABLE' })

        // Act
        page.resetFilters()

        // Assert
        expect(page.model()).toEqual({ q: '', at: null, status: '', isVisible: '' })
        expect(facade['fetchVehiclesPage']).toHaveBeenLastCalledWith(0, undefined)
    })
})
