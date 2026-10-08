import { TestBed } from '@angular/core/testing'
import { ToastMessageOptions } from 'primeng/api'
import { describe, expect, it } from 'vitest'
import { NotificationStore } from '@core/registry/state/notification.store'

describe( 'NotificationStore', () => {
    it( 'delivers every notification to a listener, even several in a row', () => {
        // Arrange
        const store: InstanceType<typeof NotificationStore> = TestBed.inject( NotificationStore )
        const received: string[] = []
        store.messages$().subscribe( (message: ToastMessageOptions): number => received.push( message.summary! ) )

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
        store.messages$().subscribe( (message: ToastMessageOptions): number => received.push( message.summary! ) )

        // Assert
        expect( received ).toEqual( [] )
    } )
} )
