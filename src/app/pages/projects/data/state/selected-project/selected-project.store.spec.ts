import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { AlertApi } from '@pages/projects/[projectId]/alerts/data/state/alert.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ProjectStatusModel } from '@shared/models/model/project-status.model'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

describe( 'SelectedProjectStore', () => {
    let store: InstanceType<typeof SelectedProjectStore>
    let findMovements: Mock<MovementApi['findMovements']>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let findParticipantsStatus: Mock<MovementApi['findParticipantsStatus']>
    let findVehiclesStatus: Mock<MovementApi['findVehiclesStatus']>
    let findAlerts: Mock<AlertApi['findAlerts']>
    let findParticipantsBirthdays: Mock<ParticipantApi['findParticipantsBirthdays']>
    let findParticipants: Mock<ParticipantApi['findParticipants']>
    let findPlannedArrivals: Mock<MovementApi['findPlannedArrivals']>
    let findPlannedDepartures: Mock<MovementApi['findPlannedDepartures']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findMovements = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        findParticipantsStatus = vi.fn()
        findVehiclesStatus = vi.fn()
        findAlerts = vi.fn()
        findParticipantsBirthdays = vi.fn()
        findParticipants = vi.fn()
        findPlannedArrivals = vi.fn()
        findPlannedDepartures = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                SelectedProjectStore,
                { provide: MovementApi, useValue: { findPlannedArrivals, findPlannedDepartures, findMovements, findMovementsContents, findParticipantsStatus, findVehiclesStatus } },
                { provide: AlertApi, useValue: { findAlerts } },
                { provide: ParticipantApi, useValue: { findParticipantsBirthdays, findParticipants } },
                { provide: ErrorReporter, useValue: { notify } },
            ],
        } )
        store = TestBed.inject( SelectedProjectStore )
    } )

    it( 'only follows alerts that are in progress and visible', () => {
        // Arrange
        const expectedStatus: AlertStatusEnum = AlertStatusEnum.IN_PROGRESS

        // Act
        const params: ReturnType<typeof store.alerts.params> = store.alerts.params()

        // Assert
        expect( params.status ).toBe( expectedStatus )
        expect( params.isVisible ).toBe( true )
    } )

    it( 'stores the participants status and ends its loading state', () => {
        // Arrange
        findParticipantsStatus.mockReturnValue( of( { guests: 2 } as unknown as ProjectStatusModel ) )

        // Act
        store.fetchParticipantsStatus( 'p1' )

        // Assert
        expect( store.status.participants.element()?.guests ).toBe( 2 )
        expect( store.status.participants.loading() ).toBe( false )
        expect( findParticipantsStatus ).toHaveBeenCalledWith( 'p1' )
    } )

    it( 'keeps a failed status fetch in the status of that widget only', () => {
        // Arrange
        findVehiclesStatus.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchVehiclesStatus( 'p1' )

        // Assert
        expect( store.status.vehicles.error()?.summary ).toBe( 'Title' )
        expect( store.status.participants.error() ).toBeUndefined()
        expect( store.status.vehicles.loading() ).toBe( false )
    } )

    it( 'keeps a 503 on a status fetch in the status block', () => {
        // Arrange
        findParticipantsStatus.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchParticipantsStatus( 'p1' )

        // Assert
        expect( store.status.participants.error() ).toBeDefined()
    } )

    it( 'stores the participants to regularize, asking for the on-site overdue ones, the earliest planned end first', () => {
        // Arrange
        findParticipants.mockReturnValue( of( pageOf<ParticipantModel>( [ { id: 'pa1' } as ParticipantModel ] ) ) )

        // Act
        store.fetchOverduePage( { projectId: 'p1', page: 0, size: 5 } )

        // Assert
        expect( store.overdue.element()?.content ).toHaveLength( 1 )
        expect( findParticipants ).toHaveBeenCalledWith( 'p1', 0, 5, expect.objectContaining( { status: 'OVERDUE', onSite: true, isVisible: true, sort: 'endAvailability' } ) )
    } )

    it( 'keeps a failed participants to regularize fetch in its own block', () => {
        // Arrange
        findParticipants.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchOverduePage( { projectId: 'p1', page: 0, size: 5 } )

        // Assert
        expect( store.overdue.error()?.summary ).toBe( 'Title' )
        expect( store.overdue.loading() ).toBe( false )
    } )

    it( 'lists all the participants to regularize apart from the few shown on the dashboard, batch after batch', () => {
        // Arrange
        findParticipants.mockReturnValue( of( pageOf<ParticipantModel>( [ { id: 'pa1' } as ParticipantModel ] ) ) )
        store.fetchOverduePage( { projectId: 'p1', page: 0, size: 5 } )
        findParticipants.mockReturnValue( of( { ...pageOf<ParticipantModel>( [ { id: 'pa2' } as ParticipantModel ] ), page: 1 } ) )

        // Act
        store.fetchOverdueListPage( { projectId: 'p1', page: undefined, size: 20 } )
        store.fetchOverdueListPage( { projectId: 'p1', page: 1, size: 20 } )

        // Assert
        expect( store.overdueList.element()?.content.map( (participant: ParticipantModel): string => participant.id ) ).toEqual( [ 'pa2' ] )
        expect( store.overdue.element()?.content ).toHaveLength( 1 )
    } )

    it( 'stores the planned arrivals and departures apart from each other', () => {
        // Arrange
        findPlannedArrivals.mockReturnValue( of( [ { poolName: 'Arriving' } as PlannedMovementModel ] ) )
        findPlannedDepartures.mockReturnValue( of( [ { poolName: 'Leaving' } as PlannedMovementModel, { poolName: 'Leaving too' } as PlannedMovementModel ] ) )

        // Act
        store.fetchPlannedArrivals( 'p1' )
        store.fetchPlannedDepartures( 'p1' )

        // Assert
        expect( store.arrivals.element() ).toHaveLength( 1 )
        expect( store.departures.element() ).toHaveLength( 2 )
    } )

    it( 'keeps a failed planned arrivals fetch in its own block', () => {
        // Arrange
        findPlannedArrivals.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchPlannedArrivals( 'p1' )

        // Assert
        expect( store.arrivals.error()?.summary ).toBe( 'Title' )
        expect( store.departures.error() ).toBeUndefined()
    } )

    it( 'stores the birthdays of the participants', () => {
        // Arrange
        findParticipantsBirthdays.mockReturnValue( of( [ { id: 'pa1' } as ParticipantModel ] ) )

        // Act
        store.fetchParticipantsBirthdays( 'p1' )

        // Assert
        expect( store.birthdays.element() ).toHaveLength( 1 )
        expect( store.birthdays.loading() ).toBe( false )
    } )

    it( 'keeps a failed birthdays fetch in its own block and keeps the previous ones', () => {
        // Arrange
        findParticipantsBirthdays.mockReturnValueOnce( of( [ { id: 'pa1' } as ParticipantModel ] ) )
        findParticipantsBirthdays.mockReturnValueOnce( failing( ERROR_500 ) )
        store.fetchParticipantsBirthdays( 'p1' )

        // Act
        store.fetchParticipantsBirthdays( 'p1' )

        // Assert
        expect( store.birthdays.error()?.summary ).toBe( 'Title' )
        expect( store.birthdays.element() ).toHaveLength( 1 )
    } )

    it( 'stores the current movements without activity and fetches their contents among current movements', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( of( [ { first: 'm1', second: [ { id: 'c1' } as unknown as MovementContentModel ] } ] ) )

        // Act
        store.fetchCurrentMovementsPageWithoutActivity( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 0, 10, expect.objectContaining( { isCurrent: true, hasActivity: false } ) )
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1' ], true )
        expect( store.isCurrent.withoutActivity.element()?.content[ 0 ].content ).toHaveLength( 1 )
        expect( store.isCurrent.withActivity.element() ).toBeUndefined()
    } )

    it( 'asks for the movements linked to an activity for the with-activity block', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [] ) ) )

        // Act
        store.fetchCurrentMovementsPageWithActivity( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 0, 10, expect.objectContaining( { hasActivity: true } ) )
        expect( findMovementsContents ).not.toHaveBeenCalled()
    } )

    it( 'keeps a failed current movements fetch in its own block', () => {
        // Arrange
        findMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchCurrentMovementsPageWithActivity( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.isCurrent.withActivity.error()?.summary ).toBe( 'Title' )
        expect( store.isCurrent.withoutActivity.error() ).toBeUndefined()
        expect( store.isCurrent.withActivity.loading() ).toBe( false )
    } )

    it( 'keeps a failed contents fetch in the section error and leaves the movements page as it was', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchCurrentMovementsPageWithoutActivity( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.sectionErrors()[ 'contents.withoutActivity' ]?.summary ).toBe( 'Title' )
        expect( store.isCurrent.withoutActivity.element()?.content[ 0 ].id ).toBe( 'm1' )
    } )

    it( 'stores the current alerts page', () => {
        // Arrange
        findAlerts.mockReturnValue( of( pageOf<AlertModel>( [ { id: 'al1' } as AlertModel ] ) ) )

        // Act
        store.fetchCurrentAlertsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.alerts.element()?.content ).toHaveLength( 1 )
    } )

    it( 'keeps a failed alerts fetch in the alerts block, a 503 included', () => {
        // Arrange
        findAlerts.mockReturnValueOnce( failing( ERROR_500 ) )
        findAlerts.mockReturnValueOnce( failing( ERROR_503 ) )

        // Act
        store.fetchCurrentAlertsPage( { projectId: 'p1', page: 0, size: 10 } )
        const keptError: string | undefined = store.alerts.error()?.summary
        store.fetchCurrentAlertsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( keptError ).toBe( 'Title' )
        expect( store.alerts.error() ).toBeDefined()
    } )
} )
