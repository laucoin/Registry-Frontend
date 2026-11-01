import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ActivityStatisticsModel } from '@shared/models/model/activity-statistics.model'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ActivityModel } from '@shared/models/model/activity.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PairModel } from '@shared/models/model/pair.model'

describe( 'ActivityStore', () => {
    let store: InstanceType<typeof ActivityStore>
    let findActivities: Mock<ActivityApi['findActivities']>
    let findActivityMovements: Mock<ActivityApi['findActivityMovements']>
    let findActivityStatistics: Mock<ActivityApi['findActivityStatistics']>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findActivities = vi.fn()
        findActivityMovements = vi.fn()
        findActivityStatistics = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ActivityStore,
                { provide: ActivityApi, useValue: { findActivities, findActivityMovements, findActivityStatistics } },
                { provide: MovementApi, useValue: { findMovementsContents } },
                { provide: ErrorReporter, useValue: { notify } },
            ],
        } )
        store = TestBed.inject( ActivityStore )
    } )

    it( 'appends the next batch to the activities already shown', () => {
        // Arrange
        findActivities
            .mockReturnValueOnce( of( { ...pageOf<ActivityModel>( [ { id: 'a1' } as ActivityModel ] ), size: 1, totalPages: 2 } ) )
            .mockReturnValueOnce( of( { ...pageOf<ActivityModel>( [ { id: 'a2' } as ActivityModel ], 1 ), size: 1, totalPages: 2 } ) )
        store.fetchActivitiesPage( { projectId: 'p1', page: 0, size: 1 } )

        // Act
        store.fetchActivitiesPage( { projectId: 'p1', page: 1, size: 1 } )

        // Assert
        expect( store.activities.element()?.content.map( (element: ActivityModel): string => element.id ) ).toEqual( [ 'a1', 'a2' ] )
    } )

    it( 'stores the fetched activities page', () => {
        // Arrange
        findActivities.mockReturnValue( of( pageOf<ActivityModel>( [ { id: 'a1' } as ActivityModel ] ) ) )

        // Act
        store.fetchActivitiesPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.activities.element()?.content ).toHaveLength( 1 )
        expect( store.activities.loading() ).toBe( false )
    } )

    it( 'keeps a failed activities fetch in the activities block', () => {
        // Arrange
        findActivities.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchActivitiesPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.activities.error()?.summary ).toBe( 'Title' )
        expect( store.movements.error() ).toBeUndefined()
    } )

    it( 'keeps a 503 failure in its block', () => {
        // Arrange
        findActivities.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchActivitiesPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.activities.error() ).toBeDefined()
    } )

    it( 'loads the movements of an activity then fetches their contents', () => {
        // Arrange
        findActivityMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel, { id: 'm2' } as MovementModel ] ) ) )
        const contents: PairModel<MovementContentModel[]>[] = [ { first: 'm1', second: [ { id: 'c1' } as unknown as MovementContentModel ] } ]
        findMovementsContents.mockReturnValue( of( contents ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', page: 0, size: 10 } )

        // Assert
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1', 'm2' ], false )
        expect( store.movements.element()?.content[ 0 ].content ).toHaveLength( 1 )
        expect( store.movements.element()?.content[ 1 ].content ).toEqual( [] )
    } )

    it( 'does not fetch contents when the activity has no movement', () => {
        // Arrange
        findActivityMovements.mockReturnValue( of( pageOf<MovementModel>( [] ) ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', page: 0, size: 10 } )

        // Assert
        expect( findMovementsContents ).not.toHaveBeenCalled()
        expect( store.movements.element()?.content ).toEqual( [] )
    } )

    it( 'keeps a failed movements fetch in the movements block', () => {
        // Arrange
        findActivityMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', page: 0, size: 10 } )

        // Assert
        expect( store.movements.error()?.summary ).toBe( 'Title' )
        expect( store.activities.error() ).toBeUndefined()
    } )

    it( 'keeps a failed contents fetch in the section error and leaves the movements as they were', () => {
        // Arrange
        findActivityMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', page: 0, size: 10 } )

        // Assert
        expect( store.sectionErrors()[ 'contents' ]?.summary ).toBe( 'Title' )
        expect( store.movements.element()?.content[ 0 ].id ).toBe( 'm1' )
    } )

    it( 'replaces the search parameters of both blocks independently', () => {
        // Arrange
        const activitiesParams: ReturnType<typeof store.activities.params> = { ...store.activities.params(), q: 'camp' }

        // Act
        store.updateActivitiesPageSearchParams( activitiesParams )

        // Assert
        expect( store.activities.params.q() ).toBe( 'camp' )
        expect( store.movements.params.type() ).toBeUndefined()
    } )

    it( 'stores the statistics of an activity and ends their loading state', () => {
        // Arrange
        const statistics: ActivityStatisticsModel = { participantCount: 2, projectParticipantCount: 4, participantRate: 0.5, movementSeconds: 60, manSeconds: 120 }
        findActivityStatistics.mockReturnValue( of( statistics ) )

        // Act
        store.fetchActivityStatistics( { projectId: 'p1', id: 'a1' } )

        // Assert
        expect( findActivityStatistics ).toHaveBeenCalledWith( 'p1', 'a1' )
        expect( store.statistics.element() ).toEqual( statistics )
        expect( store.statistics.loading() ).toBe( false )
    } )

    it( 'keeps a failed statistics fetch in the statistics block only and still works afterwards', () => {
        // Arrange
        findActivityStatistics.mockReturnValueOnce( failing( ERROR_500 ) )
        store.fetchActivityStatistics( { projectId: 'p1', id: 'a1' } )
        const failure: string | undefined = store.statistics.error()?.summary
        findActivityStatistics.mockReturnValue( of( { participantCount: 0, projectParticipantCount: 0, participantRate: undefined, movementSeconds: 0, manSeconds: 0 } ) )

        // Act
        store.fetchActivityStatistics( { projectId: 'p1', id: 'a1' } )

        // Assert
        expect( failure ).toBe( 'Title' )
        expect( store.movements.error() ).toBeUndefined()
        expect( store.statistics.error() ).toBeUndefined()
        expect( store.statistics.element()?.participantRate ).toBeUndefined()
    } )

    it( 'reloads the statistics silently and keeps the previous ones when it fails', () => {
        // Arrange
        findActivityStatistics.mockReturnValueOnce( of( { participantCount: 1, projectParticipantCount: 2, participantRate: 0.5, movementSeconds: 5, manSeconds: 5 } ) )
        store.fetchActivityStatistics( { projectId: 'p1', id: 'a1' } )
        findActivityStatistics.mockReturnValueOnce( failing( ERROR_500 ) )

        // Act
        store.reloadActivityStatistics( { projectId: 'p1', id: 'a1' } )

        // Assert
        expect( store.statistics.element()?.participantCount ).toBe( 1 )
        expect( store.statistics.loading() ).toBe( false )
        expect( store.statistics.error() ).toBeUndefined()
    } )
} )
