import { ValidationError } from '@angular/forms/signals'
import { Mock, describe, expect, it, vi } from 'vitest'
import { FieldErrorHelper } from '@shared/helpers/form/field-error.helper'
import { FieldErrorState } from '@shared/helpers/form/field-state.helper'

function stateOf (errors: object[], value: unknown = '', shown: boolean = true): () => FieldErrorState {
    const state: FieldErrorState = {
        invalid: (): boolean => errors.length > 0,
        touched: (): boolean => shown,
        dirty: (): boolean => false,
        errors: (): readonly ValidationError[] => errors as ValidationError[],
        value: (): unknown => value,
    }
    return (): FieldErrorState => state
}

describe( 'FieldErrorHelper', () => {
    it( 'has no text for a valid field, an untouched one or a field without error entry', () => {
        // Arrange
        const translate: Mock<(key: string, params: object) => string> = vi.fn( (key: string): string => key )
        const states: (() => FieldErrorState)[] = [ stateOf( [] ), stateOf( [ { kind: 'required' } ], '', false ) ]

        // Act
        const texts: (string | undefined)[] = states.map( (state: () => FieldErrorState): string | undefined => FieldErrorHelper.text( state, 'form.error', {}, translate ) )

        // Assert
        expect( texts ).toEqual( [ undefined, undefined ] )
        expect( translate ).not.toHaveBeenCalled()
    } )

    it( 'translates the first error under the prefix', () => {
        // Arrange
        const state: () => FieldErrorState = stateOf( [ { kind: 'required' }, { kind: 'blank' } ] )

        // Act
        const text: string | undefined = FieldErrorHelper.text( state, 'form.error', {}, (key: string): string => key )

        // Assert
        expect( text ).toBe( 'form.error.required' )
    } )

    it.each( [
        [ 'minLength', { kind: 'minLength', minLength: 3 }, 'abcdefgh', 'minlength', { requiredLength: 3, actualLength: 8 } ],
        [ 'maxLength', { kind: 'maxLength', maxLength: 5 }, 'abcdefgh', 'maxlength', { requiredLength: 5, actualLength: 8 } ],
        [ 'min', { kind: 'min', min: 1, actual: 0 }, 0, 'min', { min: 1, actual: 0 } ],
        [ 'max', { kind: 'max', max: 9, actual: 10 }, 10, 'max', { max: 9, actual: 10 } ],
        [ 'minDate', { kind: 'minDate', min: '2026-01-01' }, '', 'minDate', { min: '2026-01-01' } ],
        [ 'maxDate', { kind: 'maxDate', max: '2026-12-31' }, '', 'maxDate', { max: '2026-12-31' } ],
        [ 'rangeMin', { kind: 'rangeMin', min: 2, actual: 1 }, '', 'rangeMin', { min: 2, actual: 1 } ],
        [ 'rangeMax', { kind: 'rangeMax', max: 5, actual: 6 }, '', 'rangeMax', { max: 5, actual: 6 } ],
        [ 'incompatibleReason', { kind: 'incompatibleReason', reason: 'X' }, '', 'incompatibleReason', { reason: 'X' } ],
        [ 'preRequiredOptions', { kind: 'preRequiredOptions', for: 'A', missing: 'B' }, '', 'preRequiredOptions', { for: 'A', missing: 'B' } ],
    ] )( 'maps the %s error to its translation key and parameters', (_name: string, error: object, value: unknown, key: string, params: object) => {
        // Arrange : the case comes from the table
        const translate: Mock<(key: string, params: object) => string> = vi.fn( (): string => 'text' )

        // Act
        FieldErrorHelper.text( stateOf( [ error ], value ), 'form.error', {}, translate )

        // Assert
        expect( translate ).toHaveBeenCalledWith( `form.error.${key}`, params )
    } )

    it( 'merges the arguments of the caller with those of the error', () => {
        // Arrange
        const translate: Mock<(key: string, params: object) => string> = vi.fn( (): string => 'text' )

        // Act
        FieldErrorHelper.text( stateOf( [ { kind: 'min', min: 1, actual: 0 } ] ), 'form.error', { name: 'Ada' }, translate )

        // Assert
        expect( translate ).toHaveBeenCalledWith( 'form.error.min', { name: 'Ada', min: 1, actual: 0 } )
    } )

    it( 'gives an empty parameter when the error does not carry it', () => {
        // Arrange
        const translate: Mock<(key: string, params: object) => string> = vi.fn( (): string => 'text' )

        // Act
        FieldErrorHelper.text( stateOf( [ { kind: 'min' } ] ), 'form.error', {}, translate )

        // Assert
        expect( translate ).toHaveBeenCalledWith( 'form.error.min', { min: '', actual: '' } )
    } )
} )
