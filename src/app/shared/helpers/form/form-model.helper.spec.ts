import { describe, expect, it } from 'vitest'
import { FormModelHelper } from '@shared/helpers/form/form-model.helper'

describe( 'FormModelHelper', () => {
    it( 'copies every item so the source objects stay untouched', () => {
        // Arrange
        const source: { id: string }[] = [ { id: 'a' }, { id: 'b' } ]

        // Act
        const copies: { id: string }[] = FormModelHelper.copyItems( source )
        const tag: symbol = Symbol( 'tag' )
        ;(copies[ 0 ] as Record<symbol, unknown>)[ tag ] = true

        // Assert
        expect( copies.map( (item: { id: string }): string => item.id ) ).toEqual( [ 'a', 'b' ] )
        expect( Object.getOwnPropertySymbols( source[ 0 ] ) ).toEqual( [] )
        expect( copies[ 0 ] ).not.toBe( source[ 0 ] )
    } )

    it( 'gives an empty list when there is nothing to copy', () => {
        // Arrange
        const source: undefined = undefined

        // Act
        const copies: object[] = FormModelHelper.copyItems( source )

        // Assert
        expect( copies ).toEqual( [] )
    } )
} )
