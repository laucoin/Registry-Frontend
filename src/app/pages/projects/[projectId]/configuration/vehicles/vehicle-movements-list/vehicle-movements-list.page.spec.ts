import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { SessionFacade } from '@core/registry/state/session.facade'
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
    let fetchTimeline: Mock
    let reloadTimeline: Mock
    let inputSearch: Mock
    let query: BehaviorSubject<ParamMap>
    let page: VehicleMovementsListPage

    function routeTo(id: string): void {
        snapshotParams = { [ID_PARAM]: id }
        params.next(convertToParamMap(snapshotParams))
    }

    beforeEach(() => {
        snapshotParams = { [ID_PARAM]: 'vehicle1' }
        params = new BehaviorSubject<ParamMap>(convertToParamMap(snapshotParams))
        query = new BehaviorSubject<ParamMap>(convertToParamMap({}))
        firstPageReload = new Subject<void>()
        currentPageReload = new Subject<void>()
        fetchEntity = vi.fn(() => of(ENTITY))
        fetchMovements = vi.fn()
        reloadMovements = vi.fn()
        fetchTimeline = vi.fn()
        reloadTimeline = vi.fn()
        inputSearch = vi.fn()
        TestBed.configureTestingModule({
            providers: [
                { provide: ActivatedRoute, useValue: { paramMap: params, queryParamMap: query, get snapshot(): object { return { params: snapshotParams, queryParamMap: convertToParamMap({}) } } } },
                {
                    provide: MovementFacade,
                    useValue: { handleMovementFirstPageReload: (): Subject<void> => firstPageReload, handleMovementCurrentPageReload: (): Subject<void> => currentPageReload },
                },
                { provide: SessionFacade, useValue: { selectedProject: signal(undefined) } },
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
                        fetchVehicleTimeline: fetchTimeline,
                        reloadVehicleTimeline: reloadTimeline,
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
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: '', sortBy: '', sortDirection: 'asc' })

        // Act
        page['search']()

        // Assert
        expect(inputSearch).toHaveBeenLastCalledWith('IN', undefined, undefined, undefined, undefined)
        expect(fetchMovements).toHaveBeenLastCalledWith('vehicle1', 0, undefined)
    })

    it('reloads the movements when the filters of the url change', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        query.next(convertToParamMap({ type: 'IN' }))
        TestBed.tick()

        // Assert
        expect(page['model']()).toEqual({ type: 'IN', from: null, to: null, isVisible: '', sortBy: '', sortDirection: 'asc' })
        expect(inputSearch).toHaveBeenLastCalledWith('IN', undefined, undefined, undefined, undefined)
        expect(fetchMovements).toHaveBeenCalledWith('vehicle1', undefined, undefined)
    })

    it('writes the submitted filters in the url', () => {
        // Arrange
        const navigate: Mock = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: '', sortBy: '', sortDirection: 'asc' })

        // Act
        page['search']()

        // Assert
        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { type: 'IN', from: null, to: null, isVisible: null, sort: null } }))
    })

    it('clears the filters then searches from the first batch', () => {
        // Arrange
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: 'true', sortBy: '', sortDirection: 'asc' })

        // Act
        page['resetFilters']()

        // Assert
        expect(page['model']()).toEqual({ type: '', from: null, to: null, isVisible: '', sortBy: '', sortDirection: 'asc' })
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

    it('loads the timeline of the vehicle when created', () => {
        // Arrange

        // Act
        const calls: unknown[][] = fetchTimeline.mock.calls

        // Assert
        expect(calls).toEqual([['vehicle1']])
    })

    it('reloads the timeline when a movement is created or changes', () => {
        // Arrange
        reloadTimeline.mockClear()

        // Act
        firstPageReload.next()
        currentPageReload.next()

        // Assert
        expect(reloadTimeline).toHaveBeenCalledTimes(2)
        expect(reloadTimeline).toHaveBeenCalledWith('vehicle1')
    })

    it('loads the timeline again when the user retries after a failure', () => {
        // Arrange
        fetchTimeline.mockClear()

        // Act
        page['retryTimeline']()

        // Assert
        expect(fetchTimeline).toHaveBeenCalledWith('vehicle1')
    })

    it('stops listening once destroyed', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        TestBed.resetTestingModule()
        firstPageReload.next()

        // Assert
        expect(fetchMovements).not.toHaveBeenCalled()
    })
})
