import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { ConfirmationModel } from '@shared/models/model/confirmation.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { beforeEach, describe, expect, it } from 'vitest'
import { NotificationStore } from '@core/registry/state/notification.store'

describe( 'NotificationStore', () => {
    beforeEach( () => {
        TestBed.configureTestingModule( { providers: [ { provide: TranslocoService, useValue: { translate: (key: string): string => `t:${key}` } } ] } )
    } )

    it( 'delivers every notification to a listener, even several in a row', () => {
        // Arrange
        const store: InstanceType<typeof NotificationStore> = TestBed.inject( NotificationStore )
        const received: string[] = []
        store.messages$().subscribe( (message: NotificationModel): number => received.push( message.summary! ) )

        // Act
        store.notify( { summary: 'first' } )
        store.notify( { summary: 'second' } )

        // Assert
        expect( received ).toEqual( [ 'first', 'second' ] )
    } )

    it( 'does not replay past notifications to a late listener', () => {
        // Arrange
        const store: InstanceType<typeof NotificationStore> = TestBed.inject( NotificationStore )
        store.notify( { summary: 'missed' } )
        const received: string[] = []

        // Act
        store.messages$().subscribe( (message: NotificationModel): number => received.push( message.summary! ) )

        // Assert
        expect( received ).toEqual( [] )
    } )

    it( 'drops the notifications of an unauthorized call', () => {
        // Arrange
        const store: InstanceType<typeof NotificationStore> = TestBed.inject( NotificationStore )
        const received: NotificationModel[] = []
        store.messages$().subscribe( (message: NotificationModel): number => received.push( message ) )

        // Act
        store.notify( { summary: 'error 401', detail: 'x' } )

        // Assert
        expect( received ).toEqual( [] )
    } )

    it( 'fills a notification that has neither summary nor detail with the unknown error text', () => {
        // Arrange
        const store: InstanceType<typeof NotificationStore> = TestBed.inject( NotificationStore )
        const received: NotificationModel[] = []
        store.messages$().subscribe( (message: NotificationModel): number => received.push( message ) )

        // Act
        store.notify( { severity: 'error', summary: ' ', detail: '' } )

        // Assert
        expect( received[ 0 ].detail ).toBe( 't:global.notifications.UNKNOWN_ERROR' )
    } )

    it( 'forwards a normal notification untouched', () => {
        // Arrange
        const store: InstanceType<typeof NotificationStore> = TestBed.inject( NotificationStore )
        const received: NotificationModel[] = []
        store.messages$().subscribe( (message: NotificationModel): number => received.push( message ) )
        const message: NotificationModel = { severity: 'success', summary: 'Done', detail: 'ok' }

        // Act
        store.notify( message )

        // Assert
        expect( received ).toEqual( [ message ] )
    } )

    it( 'delivers every confirmation request to its listener', () => {
        // Arrange
        const store: InstanceType<typeof NotificationStore> = TestBed.inject( NotificationStore )
        const received: ConfirmationModel[] = []
        const confirmation: ConfirmationModel = { header: 'h', message: 'm', icon: 'i', acceptSeverity: SeverityEnum.DANGER, accept: (): void => undefined }
        store.confirmations$().subscribe( (it: ConfirmationModel): number => received.push( it ) )

        // Act
        store.confirm( confirmation )

        // Assert
        expect( received ).toEqual( [ confirmation ] )
    } )
} )
