import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { ParticipantApi } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.api'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ProjectStatusModel } from '@pages/projects/data/model/project-status.model'
import { SelectedProjectStore } from '@pages/projects/data/state/selected-project/selected-project.store'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ParticipantModel } from '@shared/models/model/participant.model'

describe( 'SelectedProjectStore', () => {
    let store: InstanceType<typeof SelectedProjectStore>
    let findMovements: Mock<MovementApi['findMovements']>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let findParticipantsStatus: Mock<MovementApi['findParticipantsStatus']>
    let findVehiclesStatus: Mock<MovementApi['findVehiclesStatus']>
    let findAlerts: Mock<AlertApi['findAlerts']>
    let findParticipantsBirthdays: Mock<ParticipantApi['findParticipantsBirthdays']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findMovements = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        findParticipantsStatus = vi.fn()
        findVehiclesStatus = vi.fn()
        findAlerts = vi.fn()
        findParticipantsBirthdays = vi.fn()
        setGlobalError = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                SelectedProjectStore,
                { provide: MovementApi, useValue: { findMovements, findMovementsContents, findParticipantsStatus, findVehiclesStatus } },
                { provide: AlertApi, useValue: { findAlerts } },
                { provide: ParticipantApi, useValue: { findParticipantsBirthdays } },
                { provide: ErrorReporter, useValue: { setGlobalError, notify } },
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
        expect( params.statusSearched ).toBe( expectedStatus )
        expect( params.visibilitySearched ).toBe( true )
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

    it( 'reports a 503 on a status fetch as the global error', () => {
        // Arrange
        findParticipantsStatus.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchParticipantsStatus( 'p1' )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
        expect( store.status.participants.error() ).toBeUndefined()
    } )

    it( 'stores the birthdays of the participants', () => {
        // Arrange
        findParticipantsBirthdays.mockReturnValue( of( [ { id: 'pa1' } as ParticipantModel ] ) )

        // Act
        store.fetchParticipantsBirthdays( 'p1' )

        // Assert
        expect( store.birthdays() ).toHaveLength( 1 )
    } )

    it( 'notifies a failed birthdays fetch and keeps the previous ones', () => {
        // Arrange
        findParticipantsBirthdays.mockReturnValueOnce( of( [ { id: 'pa1' } as ParticipantModel ] ) )
        findParticipantsBirthdays.mockReturnValueOnce( failing( ERROR_500 ) )
        store.fetchParticipantsBirthdays( 'p1' )

        // Act
        store.fetchParticipantsBirthdays( 'p1' )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.birthdays() ).toHaveLength( 1 )
    } )

    it( 'stores the current movements without activity and fetches their contents among current movements', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( of( [ { first: 'm1', second: [ { id: 'c1' } as unknown as MovementContentModel ] } ] ) )

        // Act
        store.fetchCurrentMovementsPageWithoutActivity( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 0, 10, expect.objectContaining( { currentMovements: true, linkedToActivity: false } ) )
        expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1' ], true )
        expect( store.currentMovements.withoutActivity.element()?.content[ 0 ].content ).toHaveLength( 1 )
        expect( store.currentMovements.withActivity.element() ).toBeUndefined()
    } )

    it( 'asks for the movements linked to an activity for the with-activity block', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [] ) ) )

        // Act
        store.fetchCurrentMovementsPageWithActivity( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( findMovements ).toHaveBeenCalledWith( 'p1', 0, 10, expect.objectContaining( { linkedToActivity: true } ) )
        expect( findMovementsContents ).not.toHaveBeenCalled()
    } )

    it( 'keeps a failed current movements fetch in its own block', () => {
        // Arrange
        findMovements.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchCurrentMovementsPageWithActivity( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.currentMovements.withActivity.error()?.summary ).toBe( 'Title' )
        expect( store.currentMovements.withoutActivity.error() ).toBeUndefined()
        expect( store.currentMovements.withActivity.loading() ).toBe( false )
    } )

    it( 'notifies a failed contents fetch and leaves the movements page as it was', () => {
        // Arrange
        findMovements.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
        findMovementsContents.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchCurrentMovementsPageWithoutActivity( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.currentMovements.withoutActivity.element()?.content[ 0 ].id ).toBe( 'm1' )
    } )

    it( 'stores the current alerts page', () => {
        // Arrange
        findAlerts.mockReturnValue( of( pageOf<AlertModel>( [ { id: 'al1' } as AlertModel ] ) ) )

        // Act
        store.fetchCurrentAlertsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.alerts.element()?.content ).toHaveLength( 1 )
    } )

    it( 'keeps a failed alerts fetch in the alerts block and reports a 503 globally', () => {
        // Arrange
        findAlerts.mockReturnValueOnce( failing( ERROR_500 ) )
        findAlerts.mockReturnValueOnce( failing( ERROR_503 ) )

        // Act
        store.fetchCurrentAlertsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )
        const keptError: string | undefined = store.alerts.error()?.summary
        store.fetchCurrentAlertsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( keptError ).toBe( 'Title' )
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )
} )
