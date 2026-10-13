import { describe, it, expect } from 'vitest'
import { ArrayHelper } from './array.helper'

describe( 'ArrayHelper', () => {
    it( 'detects null or empty arrays', () => {
        // Arrange
        const filled: number[] = [ 1 ]

        // Act
        const undefinedResult: boolean = ArrayHelper.isNullOrEmpty( undefined )
        const emptyResult: boolean = ArrayHelper.isNullOrEmpty( [] )
        const filledResult: boolean = ArrayHelper.isNullOrEmpty( filled )

        // Assert
        expect( undefinedResult ).toBe( true )
        expect( emptyResult ).toBe( true )
        expect( filledResult ).toBe( false )
    } )

    it( 'checks inclusion in strict mode', () => {
        // Arrange
        const array: string[] = [ 'a' ]

        // Act
        const present: boolean = ArrayHelper.includes( array, 'a', true )
        const absent: boolean = ArrayHelper.includes( array, 'b', true )

        // Assert
        expect( present ).toBe( true )
        expect( absent ).toBe( false )
    } )

    it( 'splits an array into chunks of the given size', () => {
        // Arrange
        const array: number[] = [ 1, 2, 3, 4, 5 ]

        // Act
        const chunks: number[][] = ArrayHelper.chunk( array, 2 )

        // Assert
        expect( chunks ).toEqual( [ [ 1, 2 ], [ 3, 4 ], [ 5 ] ] )
    } )

    it( 'keeps a single empty chunk for a missing or empty array', () => {
        // Arrange
        const missing: number[] | undefined = undefined

        // Act
        const missingChunks: number[][] = ArrayHelper.chunk( missing, 2 )
        const emptyChunks: number[][] = ArrayHelper.chunk( [], 2 )

        // Assert
        expect( missingChunks ).toEqual( [ [] ] )
        expect( emptyChunks ).toEqual( [ [] ] )
    } )
} )
