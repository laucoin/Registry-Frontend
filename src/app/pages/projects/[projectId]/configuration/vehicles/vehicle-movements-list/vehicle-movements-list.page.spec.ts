import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade'
import { VehicleMovementsListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { VehicleModel } from '@shared/models/model/vehicle.model'

describe('VehicleMovementsListPage', () => {
    const ID_PARAM: string = 'vehicleId'
    const ENTITY: VehicleModel = { id: 'v1', licensePlate: 'AB-123-CD' } as VehicleModel

    let params: BehaviorSubject<ParamMap>
    let snapshotParams: Record<string, string>
    let firstPageReload: Subject<void>
    let currentPageReload: Subject<void>
    let fetchEntity: Mock
    let fetchMovements: Mock
    let reloadMovements: Mock
    let inputSearch: Mock
    let page: VehicleMovementsListPage

    function routeTo(id: string): void {
        snapshotParams = { [ID_PARAM]: id }
        params.next(convertToParamMap(snapshotParams))
    }

    beforeEach(() => {
        snapshotParams = { [ID_PARAM]: 'vehicle1' }
        params = new BehaviorSubject<ParamMap>(convertToParamMap(snapshotParams))
        firstPageReload = new Subject<void>()
        currentPageReload = new Subject<void>()
        fetchEntity = vi.fn(() => of(ENTITY))
        fetchMovements = vi.fn()
        reloadMovements = vi.fn()
        inputSearch = vi.fn()
        TestBed.configureTestingModule({
            providers: [
                { provide: ActivatedRoute, useValue: { paramMap: params, get snapshot(): object { return { params: snapshotParams } } } },
                {
                    provide: MovementFacade,
                    useValue: { handleMovementFirstPageReload: (): Subject<void> => firstPageReload, handleMovementCurrentPageReload: (): Subject<void> => currentPageReload },
                },
                {
                    provide: VehicleFacade,
                    useValue: {
                        vehicleMovementsPageTypeParam: signal(undefined),
                        vehicleMovementsPageFromParam: signal(undefined),
                        vehicleMovementsPageToParam: signal(undefined),
                        vehicleMovementsPageIsVisibleParam: signal(undefined),
                        fetchVehicle: fetchEntity,
                        fetchVehicleMovementsPage: fetchMovements,
                        reloadVehicleMovementsPage: reloadMovements,
                        inputMovementsPageSearchParameters: inputSearch,
                    },
                },
            ],
        })
        page = TestBed.runInInjectionContext((): VehicleMovementsListPage => new VehicleMovementsListPage())
    })

    it('loads the vehicle and the first batch of its movements when created', () => {
        // Arrange
        const expectedTitle: string = 'AB-123-CD'

        // Act
        const title: string = page['title']()

        // Assert
        expect(fetchEntity).toHaveBeenCalledWith('vehicle1')
        expect(fetchMovements).toHaveBeenCalledWith('vehicle1', undefined, undefined)
        expect(title).toBe(expectedTitle)
    })

    it('loads the data again when the route moves to another vehicle', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        routeTo('vehicle2')

        // Assert
        expect(fetchEntity).toHaveBeenLastCalledWith('vehicle2')
        expect(fetchMovements).toHaveBeenCalledWith('vehicle2', undefined, undefined)
    })

    it('does not load the data again when the route keeps the same vehicle', () => {
        // Arrange
        fetchEntity.mockClear()

        // Act
        params.next(convertToParamMap({ ...snapshotParams, tab: 'movements' }))

        // Assert
        expect(fetchEntity).not.toHaveBeenCalled()
    })

    it('searches from the first batch with the filled filters', () => {
        // Arrange
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: '' })

        // Act
        page['search']()

        // Assert
        expect(inputSearch).toHaveBeenCalledTimes(1)
        expect(fetchMovements).toHaveBeenLastCalledWith('vehicle1', 0, undefined)
    })

    it('clears the filters then searches from the first batch', () => {
        // Arrange
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: 'true' })

        // Act
        page['resetFilters']()

        // Assert
        expect(page['model']()).toEqual({ type: '', from: null, to: null, isVisible: '' })
        expect(fetchMovements).toHaveBeenLastCalledWith('vehicle1', 0, undefined)
    })

    it('loads the requested batch', () => {
        // Arrange
        const pageEvent: { page: number, size: number } = { page: 2, size: 20 }

        // Act
        page['loadBatch'](pageEvent)

        // Assert
        expect(fetchMovements).toHaveBeenLastCalledWith('vehicle1', 2, 20)
    })

    it('goes back to the first batch when a movement is created', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        firstPageReload.next()

        // Assert
        expect(fetchMovements).toHaveBeenCalledWith('vehicle1', 0, undefined)
    })

    it('reloads the current batch when a movement changes', () => {
        // Arrange
        const reloaded: Subject<void> = currentPageReload

        // Act
        reloaded.next()

        // Assert
        expect(reloadMovements).toHaveBeenCalledWith('vehicle1')
    })

    it('stops listening once destroyed', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        page.ngOnDestroy()
        firstPageReload.next()

        // Assert
        expect(fetchMovements).not.toHaveBeenCalled()
    })
})
