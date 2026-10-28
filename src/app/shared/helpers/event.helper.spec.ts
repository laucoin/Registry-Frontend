import { describe, expect, it } from 'vitest'
import { EventHelper } from '@shared/helpers/event.helper'

describe( 'EventHelper', () => {
    it( 'recognises an event raised by the element that listens to it', () => {
        // Arrange
        const target: EventTarget = new EventTarget()
        const event: Event = Object.defineProperties( new Event( 'sgdf-hide' ), { target: { value: target }, currentTarget: { value: target } } )

        // Act
        const fromHost: boolean = EventHelper.isFromHost( event )

        // Assert
        expect( fromHost ).toBe( true )
    } )

    it( 'rejects an event that bubbled up from a nested element', () => {
        // Arrange
        const event: Event = Object.defineProperties( new Event( 'sgdf-hide' ), { target: { value: new EventTarget() }, currentTarget: { value: new EventTarget() } } )

        // Act
        const fromHost: boolean = EventHelper.isFromHost( event )

        // Assert
        expect( fromHost ).toBe( false )
    } )

    it( 'reads the value of the element that raised the event', () => {
        // Arrange
        const event: Event = Object.defineProperty( new Event( 'sgdf-change' ), 'target', { value: { value: 'abc' } } )

        // Act
        const value: string = EventHelper.valueOf( event )

        // Assert
        expect( value ).toBe( 'abc' )
    } )
} )
