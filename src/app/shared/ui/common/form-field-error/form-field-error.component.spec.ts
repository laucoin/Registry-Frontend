import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { FormFieldErrorComponent } from '@shared/ui/common/form-field-error/form-field-error.component'

describe( 'FormFieldErrorComponent', () => {
    let translate: Mock<(key: string, params?: object) => string>

    function errorTextFor (errors: object | null, invalid: boolean = true, translationArgs: object = {}): string | undefined {
        const fixture: ReturnType<typeof TestBed.createComponent<FormFieldErrorComponent>> = TestBed.createComponent( FormFieldErrorComponent )
        fixture.componentRef.setInput( 'invalid', invalid )
        fixture.componentRef.setInput( 'errors', errors )
        fixture.componentRef.setInput( 'translationPrefix', 'form.error' )
        fixture.componentRef.setInput( 'translationArgs', translationArgs )
        return (fixture.componentInstance as unknown as { errorText: () => string | undefined }).errorText()
    }

    beforeEach( () => {
        translate = vi.fn( (key: string): string => key )
        TestBed.configureTestingModule( { providers: [ { provide: TranslocoService, useValue: { translate } } ] } )
        TestBed.overrideComponent( FormFieldErrorComponent, { set: { template: '', imports: [] } } )
    } )

    it( 'shows nothing while the control is valid or has no errors', () => {
        // Arrange
        const results: (string | undefined)[] = []

        // Act
        results.push( errorTextFor( null ), errorTextFor( { required: true }, false ) )

        // Assert
        expect( results ).toEqual( [ undefined, undefined ] )
        expect( translate ).not.toHaveBeenCalled()
    } )

    it( 'translates the first error code under the prefix', () => {
        // Arrange
        const errors: object = { required: true, minlength: { requiredLength: 3, actualLength: 1 } }

        // Act
        const text: string | undefined = errorTextFor( errors )

        // Assert
        expect( text ).toBe( 'form.error.required' )
    } )

    it.each( [
        [ 'min', { min: { min: 1, actual: 0 } }, { min: 1, actual: 0 } ],
        [ 'max', { max: { max: 9, actual: 10 } }, { max: 9, actual: 10 } ],
        [ 'minlength', { minlength: { requiredLength: 3, actualLength: 1 } }, { requiredLength: 3, actualLength: 1 } ],
        [ 'minDate', { minDate: { min: '2026-01-01' } }, { min: '2026-01-01' } ],
        [ 'maxDate', { maxDate: { max: '2026-12-31' } }, { max: '2026-12-31' } ],
        [ 'rangeMin', { rangeMin: { min: 2, actual: 1 } }, { min: 2, actual: 1 } ],
        [ 'pattern', { pattern: { actualValue: 'abc' } }, { actual: 'abc' } ],
        [ 'incompatibleReason', { incompatibleReason: { reason: 'why' } }, { reason: 'why' } ],
    ] )( 'passes the parameters of a %s error to the translation', (code: string, errors: object, expected: object) => {
        // Arrange
        const extra: object = { field: 'name' }

        // Act
        errorTextFor( errors, true, extra )

        // Assert
        expect( translate ).toHaveBeenCalledWith( `form.error.${code}`, { ...extra, ...expected } )
    } )

    it( 'passes only the given arguments for a code without parameters', () => {
        // Arrange
        const extra: object = { field: 'name' }

        // Act
        errorTextFor( { required: true }, true, extra )

        // Assert
        expect( translate ).toHaveBeenCalledWith( 'form.error.required', extra )
    } )
} )
