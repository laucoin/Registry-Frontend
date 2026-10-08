import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { UiFacade } from '@core/registry/state/ui.facade'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { AlertModel } from '@shared/models/model/alert.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementModel } from '@shared/models/model/movement.model'

describe( 'CommunicationStore', () => {
    let store: InstanceType<typeof CommunicationStore>
    let findCommunications: Mock<CommunicationApi['findCommunications']>
    let findCommunicationById: Mock<CommunicationApi['findCommunicationById']>
    let searchMovements: Mock<CommunicationApi['searchMovements']>
    let searchAlerts: Mock<CommunicationApi['searchAlerts']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        findCommunications = vi.fn()
        findCommunicationById = vi.fn()
        searchMovements = vi.fn()
        searchAlerts = vi.fn()
        setGlobalError = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                CommunicationStore,
                { provide: CommunicationApi, useValue: { findCommunications, findCommunicationById, searchMovements, searchAlerts } },
                { provide: DateFormatPipe, useValue: { transform: (): string => '01/01' } },
                { provide: UiFacade, useValue: { setGlobalError, notify } },
            ],
        } )
        store = TestBed.inject( CommunicationStore )
    } )

    it( 'stores the fetched communications page', () => {
        // Arrange
        findCommunications.mockReturnValue( of( pageOf<CommunicationModel>( [ { id: 'c1' } as CommunicationModel ] ) ) )

        // Act
        store.fetchCommunicationsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.communications.element()?.content ).toHaveLength( 1 )
        expect( store.communications.loading() ).toBe( false )
    } )

    it( 'keeps a failed communications fetch in the communications block', () => {
        // Arrange
        findCommunications.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchCommunicationsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.communications.error()?.summary ).toBe( 'Title' )
    } )

    it( 'reports a 503 on the communications fetch as the global error', () => {
        // Arrange
        findCommunications.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchCommunicationsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )

    it( 'loads a single communication and ends the loading state', () => {
        // Arrange
        findCommunicationById.mockReturnValue( of( { id: 'c1' } as CommunicationModel ) )

        // Act
        store.fetchCommunication( { projectId: 'p1', id: 'c1' } )

        // Assert
        expect( store.communication.element()?.id ).toBe( 'c1' )
        expect( store.communication.loading() ).toBe( false )
    } )

    it( 'notifies a failed communication fetch and ends the loading state', () => {
        // Arrange
        findCommunicationById.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchCommunication( { projectId: 'p1', id: 'c1' } )

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
        expect( store.communication.loading() ).toBe( false )
        expect( store.communication.element() ).toBeUndefined()
    } )

    it( 'forgets the loaded communication on reset', () => {
        // Arrange
        findCommunicationById.mockReturnValue( of( { id: 'c1' } as CommunicationModel ) )
        store.fetchCommunication( { projectId: 'p1', id: 'c1' } )

        // Act
        store.resetCommunication()

        // Assert
        expect( store.communication.element() ).toBeUndefined()
    } )

    it( 'turns the searched movements into select items labelled with their reason and date', () => {
        // Arrange
        searchMovements.mockReturnValue( of( [ { id: 'm1', reason: { label: 'Arrival' } } as MovementModel ] ) )

        // Act
        store.searchMovements( { projectId: 'p1', textSearched: 'arr' } )

        // Assert
        expect( store.metadata.searchedMovements()[ 0 ].label ).toBe( 'Arrival (01/01)' )
    } )

    it( 'turns the searched alerts into select items labelled with their title and date', () => {
        // Arrange
        searchAlerts.mockReturnValue( of( [ { id: 'al1', title: 'Fire' } as AlertModel ] ) )

        // Act
        store.searchAlerts( { projectId: 'p1', textSearched: 'fi' } )

        // Assert
        expect( store.metadata.searchedAlerts()[ 0 ].label ).toBe( 'Fire (01/01)' )
    } )
} )
