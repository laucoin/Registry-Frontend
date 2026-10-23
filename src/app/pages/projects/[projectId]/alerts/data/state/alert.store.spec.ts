import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { ErrorReporter } from '@core/registry/state/error-reporter'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { CommunicationModel } from '@shared/models/model/communication.model'

describe( 'AlertStore', () => {
    let store: InstanceType<typeof AlertStore>
    let findAlerts: Mock<AlertApi['findAlerts']>
    let findAlertCommunications: Mock<AlertApi['findAlertCommunications']>
    let getAlertsStatus: Mock<MetadataApi['getAlertsStatus']>
    let getAlertCriticality: Mock<MetadataApi['getAlertCriticality']>
    let langChanges: Subject<string>

    beforeEach( () => {
        findAlerts = vi.fn()
        findAlertCommunications = vi.fn()
        getAlertsStatus = vi.fn( () => of( [ { label: 'In progress', value: AlertStatusEnum.IN_PROGRESS } ] ) )
        getAlertCriticality = vi.fn( () => of( { levels: [], rule: 'Aging rule' } ) )
        langChanges = new Subject<string>()
        TestBed.configureTestingModule( {
            providers: [
                AlertStore,
                { provide: AlertApi, useValue: { findAlerts, findAlertCommunications } },
                { provide: MetadataApi, useValue: { getAlertsStatus, getAlertCriticality } },
                { provide: ErrorReporter, useValue: { notify: vi.fn() } },
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

    it( 'loads the alert criticality rule on init and again when the language changes', () => {
        // Arrange
        langChanges.next( 'fr' )

        // Act
        langChanges.next( 'en' )

        // Assert
        expect( store.metadata.criticality()?.rule ).toBe( 'Aging rule' )
        expect( getAlertCriticality ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'keeps a failed criticality fetch in the section errors', () => {
        // Arrange
        getAlertCriticality.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchAlertCriticality()

        // Assert
        expect( store.sectionErrors()[ 'metadata.criticality' ]?.summary ).toBe( 'Title' )
    } )

    it( 'stores the fetched alerts page', () => {
        // Arrange
        findAlerts.mockReturnValue( of( pageOf<AlertModel>( [ { id: 'al1' } as AlertModel ] ) ) )

        // Act
        store.fetchAlertsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.alerts.element()?.content ).toHaveLength( 1 )
        expect( store.alerts.loading() ).toBe( false )
    } )

    it( 'keeps a failed alerts fetch in the alerts block', () => {
        // Arrange
        findAlerts.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchAlertsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.alerts.error()?.summary ).toBe( 'Title' )
        expect( store.communications.error() ).toBeUndefined()
    } )

    it( 'keeps a 503 failure in its block', () => {
        // Arrange
        findAlerts.mockReturnValue( failing( ERROR_503 ) )

        // Act
        store.fetchAlertsPage( { projectId: 'p1', page: 0, size: 10 } )

        // Assert
        expect( store.alerts.error() ).toBeDefined()
    } )

    it( 'stores the communications of an alert apart from the alerts', () => {
        // Arrange
        findAlertCommunications.mockReturnValue( of( pageOf<CommunicationModel>( [ { id: 'c1' } as CommunicationModel ] ) ) )

        // Act
        store.fetchAlertCommunicationsPage( { projectId: 'p1', id: 'al1', page: 0, size: 10 } )

        // Assert
        expect( store.communications.element()?.content ).toHaveLength( 1 )
        expect( store.alerts.element() ).toBeUndefined()
    } )

    it( 'keeps a failed communications fetch in the communications block only', () => {
        // Arrange
        findAlertCommunications.mockReturnValue( failing( ERROR_500 ) )

        // Act
        store.fetchAlertCommunicationsPage( { projectId: 'p1', id: 'al1', page: 0, size: 10 } )

        // Assert
        expect( store.communications.error()?.summary ).toBe( 'Title' )
        expect( store.alerts.error() ).toBeUndefined()
    } )
} )
