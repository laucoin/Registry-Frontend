import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { CommunicationModel } from '@pages/projects/[projectId]/movements/communication/data/model/communication.model'
import { AlertApi } from '@pages/projects/[projectId]/movements/data/state/alert.api'
import { ERROR_500, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { AlertModel } from '@shared/models/model/alert.model'
import { ErrorModel } from '@shared/models/model/error.model'

describe( 'AlertFacade', () => {
    let facade: AlertFacade
    let findAlerts: Mock<AlertApi['findAlerts']>
    let findAlertCommunications: Mock<AlertApi['findAlertCommunications']>
    let createAlert: Mock<AlertApi['createAlert']>
    let updateAlertStatusById: Mock<AlertApi['updateAlertStatusById']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findAlerts = vi.fn( () => of( pageOf<AlertModel>( [], 2 ) ) )
        findAlertCommunications = vi.fn( () => of( pageOf<CommunicationModel>( [], 1 ) ) )
        createAlert = vi.fn()
        updateAlertStatusById = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                AlertFacade,
                AlertStore,
                { provide: AlertApi, useValue: { findAlerts, findAlertCommunications, createAlert, updateAlertStatusById } },
                { provide: MetadataApi, useValue: { getAlertsStatus: vi.fn( () => of( [] ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify, setGlobalError: vi.fn() } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( AlertFacade )
        facade.fetchAlertsPage( 2, 10 )
        findAlerts.mockClear()
    } )

    it( 'fetches the requested alerts page for the selected project', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        facade.fetchAlertsPage( pageNumber, 10 )

        // Assert
        expect( findAlerts ).toHaveBeenCalledWith( 'p1', 3, 10, expect.anything() )
    } )

    it( 'restarts the alerts from the first page when their search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'fire', undefined, undefined, undefined, undefined )

        // Act
        facade.fetchAlertsPage( 4, 10 )

        // Assert
        expect( findAlerts ).toHaveBeenCalledWith( 'p1', 0, 10, expect.anything() )
    } )

    it( 'keeps the requested communications page when only the alerts search changed', () => {
        // Arrange
        facade.inputPageSearchParameters( 'fire', undefined, undefined, undefined, undefined )

        // Act
        facade.fetchAlertCommunicationsPage( 'al1', 3, 10 )

        // Assert
        expect( findAlertCommunications ).toHaveBeenCalledWith( 'p1', 'al1', 3, 10, expect.anything() )
    } )

    it( 'restarts the communications from the first page when their own search changed', () => {
        // Arrange
        facade.inputCommunicationsPageSearchParameters( 'smoke', undefined, undefined, undefined )

        // Act
        facade.fetchAlertCommunicationsPage( 'al1', 3, 10 )

        // Assert
        expect( findAlertCommunications ).toHaveBeenCalledWith( 'p1', 'al1', 0, 10, expect.anything() )
    } )

    it( 'announces a creation on the first-page reload channel', () => {
        // Arrange
        const received: string[] = []
        facade.handleAlertFirstPageReload().subscribe( (event: unknown): number => received.push( (event as { command: string }).command ) )
        createAlert.mockReturnValue( of( { id: 'al1', title: 'Fire' } as AlertModel ) )

        // Act
        facade.createAlert( {} as never ).subscribe()

        // Assert
        expect( received ).toEqual( [ 'create' ] )
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'alerts.notifications.create.title' } ) )
    } )

    it( 'announces a status change on the generic change channel only', () => {
        // Arrange
        const changes: string[] = []
        const currentPage: string[] = []
        facade.handleAlertChange().subscribe( (event: unknown): number => changes.push( (event as { command: string }).command ) )
        facade.handleAlertCurrentPageReload().subscribe( (event: unknown): number => currentPage.push( (event as { command: string }).command ) )
        updateAlertStatusById.mockReturnValue( of( { id: 'al1', title: 'Fire', status: { label: 'Resolved' } } as AlertModel ) )

        // Act
        facade.updateAlertStatus( 'al1', AlertStatusEnum.RESOLVED ).subscribe()

        // Assert
        expect( changes ).toEqual( [ 'status' ] )
        expect( currentPage ).toEqual( [] )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createAlert.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createAlert( {} as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
        expect( notify ).not.toHaveBeenCalled()
    } )
} )
