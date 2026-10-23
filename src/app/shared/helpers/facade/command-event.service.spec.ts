import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it } from 'vitest'
import { CommandEvent, CommandEventService } from '@shared/helpers/facade/command-event.service'

describe( 'CommandEventService', () => {
    let service: CommandEventService

    beforeEach( () => {
        service = TestBed.inject( CommandEventService )
    } )

    it( 'delivers an event to the listeners of its scope and command', () => {
        // Arrange
        const received: CommandEvent[] = []
        service.on( 'group', 'create', 'delete' ).subscribe( (event: { command: CommandEvent }): number => received.push( event.command ) )

        // Act
        service.emit( 'group', 'create' )
        service.emit( 'group', 'delete' )

        // Assert
        expect( received ).toEqual( [ 'create', 'delete' ] )
    } )

    it( 'ignores the commands a listener did not ask for', () => {
        // Arrange
        const received: CommandEvent[] = []
        service.on( 'group', 'create' ).subscribe( (event: { command: CommandEvent }): number => received.push( event.command ) )

        // Act
        service.emit( 'group', 'update' )

        // Assert
        expect( received ).toEqual( [] )
    } )

    it( 'keeps scopes apart', () => {
        // Arrange
        const received: string[] = []
        service.on( 'group', 'create' ).subscribe( (event: { scope: string }): number => received.push( event.scope ) )

        // Act
        service.emit( 'activity', 'create' )

        // Assert
        expect( received ).toEqual( [] )
    } )

    it( 'is shared by every instance of the facades through the root service', () => {
        // Arrange
        const other: CommandEventService = TestBed.inject( CommandEventService )
        const received: string[] = []
        service.on( 'group', 'create' ).subscribe( (): number => received.push( 'seen' ) )

        // Act
        other.emit( 'group', 'create' )

        // Assert
        expect( other ).toBe( service )
        expect( received ).toEqual( [ 'seen' ] )
    } )
} )
