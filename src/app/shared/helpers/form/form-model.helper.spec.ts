import { describe, expect, it } from 'vitest'
import { FormModelHelper, SelectableItem } from '@shared/helpers/form/form-model.helper'

describe( 'FormModelHelper', () => {
    it( 'copies every item deeply so the source objects stay untouched', () => {
        // Arrange
        const source: { id: string, tags: { name: string }[] }[] = [ { id: 'a', tags: [ { name: 'x' } ] } ]

        // Act
        const copies: { id: string, tags: { name: string }[] }[] = FormModelHelper.copyItems( source )
        const tag: symbol = Symbol( 'tag' )
        ;(copies[ 0 ].tags[ 0 ] as Record<symbol, unknown>)[ tag ] = true

        // Assert
        expect( copies ).not.toBe( source )
        expect( copies[ 0 ].tags[ 0 ] ).not.toBe( source[ 0 ].tags[ 0 ] )
        expect( Object.getOwnPropertySymbols( source[ 0 ].tags[ 0 ] ) ).toEqual( [] )
    } )

    it( 'gives an empty list when there is nothing to copy', () => {
        // Arrange
        const source: undefined = undefined

        // Act
        const copies: object[] = FormModelHelper.copyItems( source )

        // Assert
        expect( copies ).toEqual( [] )
    } )

    it( 'copies a single value deeply', () => {
        // Arrange
        const source: { label: string, value: { items: number[] } } = { label: 'l', value: { items: [ 1 ] } }

        // Act
        const copy: { label: string, value: { items: number[] } } = FormModelHelper.copy( source )

        // Assert
        expect( copy ).toEqual( source )
        expect( copy.value.items ).not.toBe( source.value.items )
    } )

    it( 'exposes each option as its own selected value', () => {
        // Arrange
        const options: { label: string, value: number }[] = [ { label: 'one', value: 1 } ]

        // Act
        const selectable: SelectableItem<number>[] = FormModelHelper.selectable( options )

        // Assert
        expect( selectable[ 0 ].self ).toBe( options[ 0 ] )
        expect( selectable[ 0 ].label ).toBe( 'one' )
    } )
} )
