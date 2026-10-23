import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade'
import { ActivityMovementsListPage } from '@pages/projects/[projectId]/configuration/activities/activity-movements-list/activity-movements-list.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ActivityModel } from '@shared/models/model/activity.model'

describe('ActivityMovementsListPage', () => {
    const ID_PARAM: string = 'activityId'
    const ENTITY: ActivityModel = { id: 'a1', name: 'Hike' } as ActivityModel

    let params: BehaviorSubject<ParamMap>
    let snapshotParams: Record<string, string>
    let firstPageReload: Subject<void>
    let currentPageReload: Subject<void>
    let fetchEntity: Mock
    let fetchMovements: Mock
    let reloadMovements: Mock
    let inputSearch: Mock
    let page: ActivityMovementsListPage

    function routeTo(id: string): void {
        snapshotParams = { [ID_PARAM]: id }
        params.next(convertToParamMap(snapshotParams))
    }

    beforeEach(() => {
        snapshotParams = { [ID_PARAM]: 'activity1' }
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
                    provide: ActivityFacade,
                    useValue: {
                        activityMovementsPageTypeParam: signal(undefined),
                        activityMovementsPageFromParam: signal(undefined),
                        activityMovementsPageToParam: signal(undefined),
                        activityMovementsPageIsVisibleParam: signal(undefined),
                        fetchActivity: fetchEntity,
                        fetchActivityMovementsPage: fetchMovements,
                        reloadActivityMovementsPage: reloadMovements,
                        inputMovementsPageSearchParameters: inputSearch,
                    },
                },
            ],
        })
        page = TestBed.runInInjectionContext((): ActivityMovementsListPage => new ActivityMovementsListPage())
    })

    it('loads the activity and the first batch of its movements when created', () => {
        // Arrange
        const expectedTitle: string = 'Hike'

        // Act
        const title: string = page['title']()

        // Assert
        expect(fetchEntity).toHaveBeenCalledWith('activity1')
        expect(fetchMovements).toHaveBeenCalledWith('activity1', undefined, undefined)
        expect(title).toBe(expectedTitle)
    })

    it('loads the data again when the route moves to another activity', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        routeTo('activity2')

        // Assert
        expect(fetchEntity).toHaveBeenLastCalledWith('activity2')
        expect(fetchMovements).toHaveBeenCalledWith('activity2', undefined, undefined)
    })

    it('does not load the data again when the route keeps the same activity', () => {
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
        expect(fetchMovements).toHaveBeenLastCalledWith('activity1', 0, undefined)
    })

    it('clears the filters then searches from the first batch', () => {
        // Arrange
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: 'true' })

        // Act
        page['resetFilters']()

        // Assert
        expect(page['model']()).toEqual({ type: '', from: null, to: null, isVisible: '' })
        expect(fetchMovements).toHaveBeenLastCalledWith('activity1', 0, undefined)
    })

    it('loads the requested batch', () => {
        // Arrange
        const pageEvent: { page: number, size: number } = { page: 2, size: 20 }

        // Act
        page['loadBatch'](pageEvent)

        // Assert
        expect(fetchMovements).toHaveBeenLastCalledWith('activity1', 2, 20)
    })

    it('goes back to the first batch when a movement is created', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        firstPageReload.next()

        // Assert
        expect(fetchMovements).toHaveBeenCalledWith('activity1', 0, undefined)
    })

    it('reloads the current batch when a movement changes', () => {
        // Arrange
        const reloaded: Subject<void> = currentPageReload

        // Act
        reloaded.next()

        // Assert
        expect(reloadMovements).toHaveBeenCalledWith('activity1')
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
