import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { SessionFacade } from '@core/registry/state/session.facade'
import { UiFacade } from '@core/registry/state/ui.facade'
import { CommunicationModel } from '@shared/models/model/communication.model'
import { CommunicationApi } from '@pages/projects/[projectId]/movements/communication/data/state/communication.api'
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade'
import { CommunicationStore } from '@pages/projects/[projectId]/movements/communication/data/state/communication.store'
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe'
import { ERROR_500, failing, provideTestConfig } from '@shared/helpers/testing/test-fixtures'
import { ErrorModel } from '@shared/models/model/error.model'

describe( 'CommunicationFacade', () => {
    let facade: CommunicationFacade
    let createCommunication: Mock<CommunicationApi['createCommunication']>
    let updateCommunicationById: Mock<CommunicationApi['updateCommunicationById']>
    let disableCommunicationById: Mock<CommunicationApi['disableCommunicationById']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        provideTestConfig()
        createCommunication = vi.fn()
        updateCommunicationById = vi.fn()
        disableCommunicationById = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                CommunicationFacade,
                CommunicationStore,
                { provide: CommunicationApi, useValue: { createCommunication, updateCommunicationById, disableCommunicationById } },
                { provide: DateFormatPipe, useValue: { transform: (): string => '01/01' } },
                { provide: SessionFacade, useValue: { currentProjectId: signal( 'p1' ) } },
                { provide: UiFacade, useValue: { notify } },
                { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } },
            ],
        } )
        facade = TestBed.inject( CommunicationFacade )
    } )

    it( 'stays silent on creation and announces it', () => {
        // Arrange
        const received: string[] = []
        facade.handleCommunicationFirstPageReload().subscribe( (event: unknown): number => received.push( (event as { command: string }).command ) )
        createCommunication.mockReturnValue( of( { id: 'c1' } as CommunicationModel ) )

        // Act
        facade.createCommunication( {} as never ).subscribe()

        // Assert
        expect( notify ).not.toHaveBeenCalled()
        expect( received ).toEqual( [ 'create' ] )
    } )

    it( 'stays silent on update and announces it for the current page', () => {
        // Arrange
        const received: string[] = []
        facade.handleCommunicationCurrentPageReload().subscribe( (event: unknown): number => received.push( (event as { command: string }).command ) )
        updateCommunicationById.mockReturnValue( of( { id: 'c1' } as CommunicationModel ) )

        // Act
        facade.updateCommunication( 'c1', {} as never ).subscribe()

        // Assert
        expect( notify ).not.toHaveBeenCalled()
        expect( received ).toEqual( [ 'update' ] )
    } )

    it( 'notifies the other commands with the formatted date', () => {
        // Arrange
        disableCommunicationById.mockReturnValue( of( { id: 'c1', dateTime: new Date() } as CommunicationModel ) )

        // Act
        facade.disableCommunication( 'c1' ).subscribe()

        // Assert
        expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'communications.notifications.disable.title', data: { datetime: '01/01' } } ) )
    } )

    it( 'lets the form handle a creation error other than 503', () => {
        // Arrange
        createCommunication.mockReturnValue( failing( ERROR_500 ) )
        let received: ErrorModel | undefined

        // Act
        facade.createCommunication( {} as never ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

        // Assert
        expect( received ).toBe( ERROR_500 )
    } )

    it( 'exposes the failure of the communication fetch', () => {
        // Arrange
        Object.assign( TestBed.inject( CommunicationApi ), { findCommunicationById: vi.fn( () => failing( ERROR_500 ) ) } )

        // Act
        facade.fetchCommunication( 'c1' )

        // Assert
        expect( facade.communicationError()?.summary ).toBe( 'Title' )
    } )
} )
