import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { Observable, of, Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MetadataApi } from '@core/registry/state/metadata.api'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade'
import { AlertStore } from '@pages/projects/[projectId]/alerts/data/state/alert.store'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { AlertApi } from '@pages/projects/[projectId]/alerts/data/state/alert.api'
import { ERROR_500, ERROR_503, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { AlertModel } from '@shared/models/model/alert.model'
import { AlertStatusEnum } from '@shared/models/enumeration/alert-status.enum'
import { ErrorModel } from '@shared/models/model/error.model'

describe( 'AlertFacade', () => {
    let facade: AlertFacade
    let findAlerts: Mock<AlertApi['findAlerts']>
    let findAlertCommunications: Mock<AlertApi['findAlertCommunications']>
    let createAlert: Mock<AlertApi['createAlert']>
    let updateAlertStatusById: Mock<AlertApi['updateAlertStatusById']>
    let disableAlertById: Mock<AlertApi['disableAlertById']>
    let enableAlertById: Mock<AlertApi['enableAlertById']>
    let deleteAlertById: Mock<AlertApi['deleteAlertById']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        findAlerts = vi.fn( () => of( pageOf<AlertModel>( [], 2 ) ) )
        findAlertCommunications = vi.fn( () => of( pageOf<CommunicationModel>( [], 1 ) ) )
        createAlert = vi.fn()
        updateAlertStatusById = vi.fn()
        disableAlertById = vi.fn()
        enableAlertById = vi.fn()
        deleteAlertById = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                AlertFacade,
                AlertStore,
                { provide: AlertApi, useValue: { findAlerts, findAlertCommunications, createAlert, updateAlertStatusById, disableAlertById, enableAlertById, deleteAlertById } },
                { provide: MetadataApi, useValue: { getAlertsStatus: vi.fn( () => of( [] ) ), getAlertCriticality: vi.fn( () => of( { levels: [], rule: 'Aging rule' } ) ) } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}`, langChanges$: new Subject<string>().asObservable() } },
            ],
        } )
        facade = TestBed.inject( AlertFacade )
        facade.fetchAlertsPage( 2, 10 )
        findAlerts.mockClear()
    } )

    it( 'exposes the sentence describing how the criticality is computed', () => {
        // Arrange
        const expected: string = 'Aging rule'

        // Act
        const rule: string | undefined = facade.alertCriticalityRule()

        // Assert
        expect( rule ).toBe( expected )
    } )

    it( 'fetches the requested alerts page for the selected project', () => {
        // Arrange
        const page: number = 3

        // Act
        facade.fetchAlertsPage( page, 10 )

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

    it( 'reloads every shown batch of the alerts in one request', () => {
        // Arrange
        const expectedProjectId: string = 'p1'
        findAlerts.mockClear()

        // Act
        facade.reloadAlertsPage()

        // Assert
        expect( findAlerts ).toHaveBeenCalledWith( expectedProjectId, 0, facade.alertsPage()!.size * 3, expect.anything() )
    } )

    it( 'appends the next batch of alerts to the ones already shown', () => {
        // Arrange
        findAlerts.mockReturnValueOnce( of( pageOf<AlertModel>( [ { id: 'a' } as AlertModel ], 0 ) ) )
        findAlerts.mockReturnValueOnce( of( pageOf<AlertModel>( [ { id: 'b' } as AlertModel ], 1 ) ) )
        facade.fetchAlertsPage( 0, 1 )

        // Act
        facade.fetchAlertsPage( 1, 1 )

        // Assert
        expect( facade.alertsPage()?.content.map( (it: AlertModel): string => it.id ) ).toEqual( [ 'a', 'b' ] )
    } )

    it.each( [ 'disable', 'enable' ] as const )( 'notifies and reloads the alerts after the alert is %sd', (command: 'disable' | 'enable') => {
        // Arrange
        const api: Mock = command === 'disable' ? disableAlertById : enableAlertById
        api.mockReturnValue( of( { id: 'al1', title: 'Fire' } as AlertModel ) )
        const call: (id: string) => Observable<AlertModel> = command === 'disable' ? facade.disableAlert.bind( facade ) : facade.enableAlert.bind( facade )

        // Act
        call( 'al1' ).subscribe()

        // Assert
        expect( api ).toHaveBeenCalledWith( 'p1', 'al1' )
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( findAlerts ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'deletes an alert whatever the selected project and then reloads the alerts', () => {
        // Arrange
        deleteAlertById.mockReturnValue( of( undefined ) )

        // Act
        facade.deleteAlert( { id: 'al1', title: 'Fire' } as AlertModel ).subscribe()

        // Assert
        expect( deleteAlertById ).toHaveBeenCalledWith( undefined, 'al1' )
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( findAlerts ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'updates the status of an alert, notifies and reloads', () => {
        // Arrange
        updateAlertStatusById.mockReturnValue( of( { id: 'al1', title: 'Fire' } as AlertModel ) )

        // Act
        facade.updateAlertStatus( 'al1', AlertStatusEnum.RESOLVED ).subscribe()

        // Assert
        expect( updateAlertStatusById ).toHaveBeenCalledWith( 'p1', 'al1', AlertStatusEnum.RESOLVED )
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( findAlerts ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'reports a failed command once and does not reload the alerts', () => {
        // Arrange
        disableAlertById.mockReturnValue( failing( ERROR_503 ) )

        // Act
        facade.disableAlert( 'al1' ).subscribe( { error: (): void => undefined } )

        // Assert
        expect( notify ).toHaveBeenCalledTimes( 1 )
        expect( findAlerts ).not.toHaveBeenCalled()
    } )

    it( 'announces a created alert to the listeners of the creation', () => {
        // Arrange
        createAlert.mockReturnValue( of( { id: 'al1', title: 'Fire' } as AlertModel ) )
        const created: Mock = vi.fn()
        facade.handleAlertCreation().subscribe( created )

        // Act
        facade.createAlert( {} as never ).subscribe()

        // Assert
        expect( created ).toHaveBeenCalledTimes( 1 )
        expect( findAlerts ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'loads the next page of older communications while the shown page has a next one', () => {
        // Arrange
        findAlertCommunications.mockReturnValue( of( { ...pageOf<CommunicationModel>( [], 0 ), hasNext: true } ) )
        facade.fetchAlertCommunicationsPage( 'al1', 0, 10 )
        findAlertCommunications.mockClear()

        // Act
        facade.loadOlderAlertCommunications( 'al1' )

        // Assert
        expect( findAlertCommunications ).toHaveBeenCalledWith( 'p1', 'al1', 1, 10, expect.anything() )
    } )

    it( 'loads no older communications when the shown page is the last one', () => {
        // Arrange
        facade.fetchAlertCommunicationsPage( 'al1', 0, 10 )
        findAlertCommunications.mockClear()

        // Act
        facade.loadOlderAlertCommunications( 'al1' )

        // Assert
        expect( findAlertCommunications ).not.toHaveBeenCalled()
    } )

    it( 'reloads the shown communications of an alert in one request', () => {
        // Arrange
        facade.fetchAlertCommunicationsPage( 'al1', 0, 10 )
        findAlertCommunications.mockClear()

        // Act
        facade.reloadAlertCommunications( 'al1' )

        // Assert
        expect( findAlertCommunications ).toHaveBeenCalledWith( 'p1', 'al1', 0, expect.any( Number ), expect.anything() )
    } )

    it( 'exposes the date bounds of the alerts search once they are input', () => {
        // Arrange
        const from: Date = new Date( '2026-01-01T00:00:00.000Z' )
        const to: Date = new Date( '2026-02-01T00:00:00.000Z' )

        // Act
        facade.inputPageSearchParameters( undefined, 'OPEN', true, from, to )

        // Assert
        expect( facade.alertsPageFromParam()?.toISOString() ).toBe( from.toISOString() )
        expect( facade.alertsPageToParam()?.toISOString() ).toBe( to.toISOString() )
        expect( facade.alertsPageStatusParam() ).toBe( 'OPEN' )
        expect( facade.alertsPageIsVisibleParam() ).toBe( true )
    } )

    it( 'ignores an unchanged search', () => {
        // Arrange
        facade.inputPageSearchParameters( 'fire', undefined, undefined, undefined, undefined )
        const before: string | undefined = facade.alertsPageQueryParam()

        // Act
        facade.inputPageSearchParameters( 'fire', undefined, undefined, undefined, undefined )

        // Assert
        expect( facade.alertsPageQueryParam() ).toBe( before )
    } )
} )
