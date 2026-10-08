import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ActivityApi } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.api'
import { ActivityStore } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.store'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { ActivityModel } from '@shared/models/model/activity.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PairModel } from '@shared/models/model/pair.model'

describe( 'ActivityStore', () => {
    let store: InstanceType<typeof ActivityStore>
    let findActivities: Mock<ActivityApi['findActivities']>
    let findActivityMovements: Mock<ActivityApi['findActivityMovements']>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findActivities = vi.fn()
        findActivityMovements = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        setGlobalError = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                ActivityStore,
                { provide: ActivityApi, useValue: { findActivities, findActivityMovements } },
                { provide: MovementApi, useValue: { findMovementsContents } },
                { provide: UiFacade, useValue: { setGlobalError, notify } },
            ],
        } )
        store = TestBed.inject( ActivityStore )
    } )

    it( 'stores the fetched activities page', () => {
        // Arrange
        findActivities.mockReturnValue( of( pageOf<ActivityModel>( [ { id: 'a1' } as ActivityModel ] ) ) )

        // Act
        store.fetchActivitiesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.activities.element()?.content ).toHaveLength( 1 )
        expect( store.activities.loading() ).toBe( false )
    } )

    it( 'keeps a failed activities fetch in the activities block', () => {
        // Arrange
        findActivities.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchActivitiesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.activities.error()?.summary ).toBe( 'Title' )
        expect( store.movements.error() ).toBeUndefined()
    } )

    it( 'reports a 503 on the activities fetch as the global error', () => {
        // Arrange
        findActivities.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchActivitiesPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )

    it( 'loads the movements of an activity then fetches their contents', () => {
        // Arrange
        findActivityMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel, { id: 'm2' } as MovementModel ] ) ) )
        const contents: PairModel<MovementContentModel[]>[] = [ { first: 'm1', second: [ { id: 'c1' } as unknown as MovementContentModel ] } ]
        findMovementsContents.mockReturnValue( of( contents ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1', 'm2' ], false )
        expect( store.movements.element()?.content[ 0 ].content ).toHaveLength( 1 )
        expect( store.movements.element()?.content[ 1 ].content ).toEqual( [] )
    } )

    it( 'does not fetch contents when the activity has no movement', () => {
        // Arrange
        findActivityMovements.mockReturnValue( of( pageOf<MovementModel>( [] ) ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovementsContents ).not.toHaveBeenCalled()
        expect( store.movements.element()?.content ).toEqual( [] )
    } )

    it( 'keeps a failed movements fetch in the movements block', () => {
        // Arrange
        findActivityMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.movements.error()?.summary ).toBe( 'Title' )
        expect( store.activities.error() ).toBeUndefined()
    } )

    it( 'notifies a failed contents fetch and leaves the movements as they were', () => {
        // Arrange
        findActivityMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchActivityMovementsPage( { projectId: 'p1', id: 'a1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.movements.element()?.content[ 0 ].id ).toBe( 'm1' )
    } )

    it( 'replaces the search parameters of both blocks independently', () => {
        // Arrange
        const activitiesParams: ReturnType<typeof store.activities.params> = { ...store.activities.params(), textSearched: 'camp' }

        // Act
        store.updateActivitiesPageSearchParams( activitiesParams )

        // Assert
        expect( store.activities.params.textSearched() ).toBe( 'camp' )
        expect( store.movements.params.typeSearched() ).toBeUndefined()
    } )
} )
