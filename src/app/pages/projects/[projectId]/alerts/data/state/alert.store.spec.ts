import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { UiFacade } from '@core/registry/state/ui.facade'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'

describe( 'AlertStore', () => {
    let store: InstanceType<typeof AlertStore>
    let findAlerts: Mock<AlertApi['findAlerts']>
    let findAlertCommunications: Mock<AlertApi['findAlertCommunications']>
    let getAlertsStatus: Mock<MetadataApi['getAlertsStatus']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let langChanges: Subject<string>

    beforeEach( () => {
        findAlerts = vi.fn()
        findAlertCommunications = vi.fn()
        getAlertsStatus = vi.fn( () => of( [ { label: 'In progress', value: AlertStatusEnum.IN_PROGRESS } ] ) )
        setGlobalError = vi.fn()
        langChanges = new Subject<string>()
        TestBed.configureTestingModule( {
            providers: [
                AlertStore,
                { provide: AlertApi, useValue: { findAlerts, findAlertCommunications } },
                { provide: MetadataApi, useValue: { getAlertsStatus } },
                { provide: UiFacade, useValue: { setGlobalError, notify: vi.fn() } },
                { provide: TranslocoService, useValue: { langChanges$: langChanges.asObservable() } },
            ],
        } )
        store = TestBed.inject( AlertStore )
    } )

    it( 'loads the alert statuses on init with an empty option first', () => {
        // Arrange
        const expectedFirst: unknown = { label: '-', value: undefined }

        // Act
        const statuses: unknown[] = store.metadata.status()

        // Assert
        expect( statuses ).toHaveLength( 2 )
        expect( statuses[ 0 ] ).toEqual( expectedFirst )
    } )

    it( 'reloads the statuses when the language changes but not on the initial language', () => {
        // Arrange
        langChanges.next( 'fr' )
        const callsAfterInitial: number = getAlertsStatus.mock.calls.length

        // Act
        langChanges.next( 'en' )

        // Assert
        expect( callsAfterInitial ).toBe( 1 )
        expect( getAlertsStatus ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'stores the fetched alerts page', () => {
        // Arrange
        findAlerts.mockReturnValue( of( pageOf<AlertModel>( [ { id: 'al1' } as AlertModel ] ) ) )

        // Act
        store.fetchAlertsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.alerts.element()?.content ).toHaveLength( 1 )
        expect( store.alerts.loading() ).toBe( false )
    } )

    it( 'keeps a failed alerts fetch in the alerts block', () => {
        // Arrange
        findAlerts.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchAlertsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.alerts.error()?.summary ).toBe( 'Title' )
        expect( store.communications.error() ).toBeUndefined()
    } )

    it( 'reports a 503 on the alerts fetch as the global error', () => {
        // Arrange
        findAlerts.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchAlertsPage( { projectId: 'p1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
    } )

    it( 'stores the communications of an alert apart from the alerts', () => {
        // Arrange
        findAlertCommunications.mockReturnValue( of( pageOf<CommunicationModel>( [ { id: 'c1' } as CommunicationModel ] ) ) )

        // Act
        store.fetchAlertCommunicationsPage( { projectId: 'p1', id: 'al1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.communications.element()?.content ).toHaveLength( 1 )
        expect( store.alerts.element() ).toBeUndefined()
    } )

    it( 'keeps a failed communications fetch in the communications block only', () => {
        // Arrange
        findAlertCommunications.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchAlertCommunicationsPage( { projectId: 'p1', id: 'al1', pageNumber: 0, pageSize: 10 } )

        // Assert
        expect( store.communications.error()?.summary ).toBe( 'Title' )
        expect( store.alerts.error() ).toBeUndefined()
    } )
} )
