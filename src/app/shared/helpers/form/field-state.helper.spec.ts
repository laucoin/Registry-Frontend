import { describe, expect, it } from 'vitest'
import { FieldErrorState, FieldStateHelper } from '@shared/helpers/form/field-state.helper'

function fieldOf (invalid: boolean, touched: boolean, dirty: boolean): () => FieldErrorState {
    const state: FieldErrorState = { invalid: () => invalid, touched: () => touched, dirty: () => dirty, errors: () => [], value: () => '' }
    return () => state
}

describe( 'FieldStateHelper', () => {
    it.each( [
        [ true, true, false, true ],
        [ true, false, true, true ],
        [ true, false, false, false ],
        [ false, true, true, false ],
    ] )( 'judges invalid=%s touched=%s dirty=%s as shown=%s', (invalid: boolean, touched: boolean, dirty: boolean, expected: boolean) => {
        // Arrange
        const field: () => FieldErrorState = fieldOf( invalid, touched, dirty )

        // Act
        const shown: boolean = FieldStateHelper.showsError( field )

        // Assert
        expect( shown ).toBe( expected )
    } )
} )
