import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BehaviorSubject, of, Subject } from 'rxjs'
import { SessionFacade } from '@core/registry/state/session.facade'
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade'
import { ParticipantMovementsListPage } from '@pages/projects/[projectId]/configuration/participants/participant-movements-list/participant-movements-list.page'
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade'
import { ParticipantModel } from '@shared/models/model/participant.model'

describe('ParticipantMovementsListPage', () => {
    const ID_PARAM: string = 'participantId'
    const ENTITY: ParticipantModel = { id: 'p1', firstName: 'Jane', lastName: 'Doe' } as ParticipantModel

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
    let page: ParticipantMovementsListPage

    function routeTo(id: string): void {
        snapshotParams = { [ID_PARAM]: id }
        params.next(convertToParamMap(snapshotParams))
    }

    beforeEach(() => {
        snapshotParams = { [ID_PARAM]: 'participant1' }
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
                    provide: ParticipantFacade,
                    useValue: {
                        participantMovementsPageTypeParam: signal(undefined),
                        participantMovementsPageFromParam: signal(undefined),
                        participantMovementsPageToParam: signal(undefined),
                        participantMovementsPageIsVisibleParam: signal(undefined),
                        fetchParticipant: fetchEntity,
                        fetchParticipantMovementsPage: fetchMovements,
                        reloadParticipantMovementsPage: reloadMovements,
                        fetchParticipantTimeline: fetchTimeline,
                        reloadParticipantTimeline: reloadTimeline,
                        inputMovementsPageSearchParameters: inputSearch,
                    },
                },
            ],
        })
        page = TestBed.runInInjectionContext((): ParticipantMovementsListPage => new ParticipantMovementsListPage())
    })

    it('loads the participant and the first batch of its movements when created', () => {
        // Arrange
        const expectedTitle: string = 'Jane DOE'

        // Act
        const title: string = page['title']()

        // Assert
        expect(fetchEntity).toHaveBeenCalledWith('participant1')
        expect(fetchMovements).toHaveBeenCalledWith('participant1', undefined, undefined)
        expect(title).toBe(expectedTitle)
    })

    it('loads the data again when the route moves to another participant', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        routeTo('participant2')

        // Assert
        expect(fetchEntity).toHaveBeenLastCalledWith('participant2')
        expect(fetchMovements).toHaveBeenCalledWith('participant2', undefined, undefined)
    })

    it('does not load the data again when the route keeps the same participant', () => {
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
        expect(inputSearch).toHaveBeenLastCalledWith('IN', undefined, undefined, undefined)
        expect(fetchMovements).toHaveBeenLastCalledWith('participant1', 0, undefined)
    })

    it('reloads the movements when the filters of the url change', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        query.next(convertToParamMap({ type: 'IN' }))
        TestBed.tick()

        // Assert
        expect(page['model']()).toEqual({ type: 'IN', from: null, to: null, isVisible: '' })
        expect(inputSearch).toHaveBeenLastCalledWith('IN', undefined, undefined, undefined)
        expect(fetchMovements).toHaveBeenCalledWith('participant1', undefined, undefined)
    })

    it('writes the submitted filters in the url', () => {
        // Arrange
        const navigate: Mock = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: '' })

        // Act
        page['search']()

        // Assert
        expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { type: 'IN', from: null, to: null, isVisible: null } }))
    })

    it('clears the filters then searches from the first batch', () => {
        // Arrange
        page['model'].set({ type: 'IN', from: null, to: null, isVisible: 'true' })

        // Act
        page['resetFilters']()

        // Assert
        expect(page['model']()).toEqual({ type: '', from: null, to: null, isVisible: '' })
        expect(fetchMovements).toHaveBeenLastCalledWith('participant1', 0, undefined)
    })

    it('loads the requested batch', () => {
        // Arrange
        const pageEvent: { page: number, size: number } = { page: 2, size: 20 }

        // Act
        page['loadBatch'](pageEvent)

        // Assert
        expect(fetchMovements).toHaveBeenLastCalledWith('participant1', 2, 20)
    })

    it('goes back to the first batch when a movement is created', () => {
        // Arrange
        fetchMovements.mockClear()

        // Act
        firstPageReload.next()

        // Assert
        expect(fetchMovements).toHaveBeenCalledWith('participant1', 0, undefined)
    })

    it('reloads the current batch when a movement changes', () => {
        // Arrange
        const reloaded: Subject<void> = currentPageReload

        // Act
        reloaded.next()

        // Assert
        expect(reloadMovements).toHaveBeenCalledWith('participant1')
    })

    it('loads the timeline of the participant when created', () => {
        // Arrange

        // Act
        const calls: unknown[][] = fetchTimeline.mock.calls

        // Assert
        expect(calls).toEqual([['participant1']])
    })

    it('reloads the timeline when a movement is created or changes', () => {
        // Arrange
        reloadTimeline.mockClear()

        // Act
        firstPageReload.next()
        currentPageReload.next()

        // Assert
        expect(reloadTimeline).toHaveBeenCalledTimes(2)
        expect(reloadTimeline).toHaveBeenCalledWith('participant1')
    })

    it('loads the timeline again when the user retries after a failure', () => {
        // Arrange
        fetchTimeline.mockClear()

        // Act
        page['retryTimeline']()

        // Assert
        expect(fetchTimeline).toHaveBeenCalledWith('participant1')
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
