import { ArrayHelper } from './array.helper'

describe( 'ArrayHelper', () => {
    it( 'detects null or empty arrays', () => {
        expect( ArrayHelper.isNullOrEmpty( undefined ) ).toBe( true )
        expect( ArrayHelper.isNullOrEmpty( [] ) ).toBe( true )
        expect( ArrayHelper.isNullOrEmpty( [ 1 ] ) ).toBe( false )
    } )

    it( 'checks inclusion in strict mode', () => {
        expect( ArrayHelper.includes( [ 'a' ], 'a', true ) ).toBe( true )
        expect( ArrayHelper.includes( [ 'a' ], 'b', true ) ).toBe( false )
    } )
} )
