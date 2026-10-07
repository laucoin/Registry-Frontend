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
} )
