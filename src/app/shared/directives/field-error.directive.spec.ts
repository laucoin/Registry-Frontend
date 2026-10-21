import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ValidationError } from '@angular/forms/signals'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { FieldErrorDirective } from '@shared/directives/field-error.directive'
import { FieldErrorState } from '@shared/helpers/form/field-state.helper'

@Component( {
    imports: [ FieldErrorDirective ],
    schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
    template: `<sgdf-input [appFieldError]='state()' translationPrefix='form.error'></sgdf-input>`,
} )
class HostComponent {
    public readonly errors: WritableSignal<object[]> = signal( [] )
    public readonly touched: WritableSignal<boolean> = signal( false )

    protected readonly state: () => () => FieldErrorState = () => (): FieldErrorState => ({
        invalid: (): boolean => this.errors().length > 0,
        touched: this.touched,
        dirty: (): boolean => false,
        errors: (): readonly ValidationError[] => this.errors() as ValidationError[],
        value: (): unknown => '',
    })
}

describe( 'FieldErrorDirective', () => {
    let fixture: ComponentFixture<HostComponent>

    function errorOfElement (): string {
        fixture.detectChanges()
        return (fixture.nativeElement.querySelector( 'sgdf-input' ) as HTMLElement).getAttribute( 'error' ) ?? ''
    }

    beforeEach( () => {
        TestBed.configureTestingModule( {
            providers: [ { provide: TranslocoService, useValue: { translate: (key: string): string => key } } ],
        } )
        fixture = TestBed.createComponent( HostComponent )
    } )

    it( 'leaves the element without error while the field is untouched', () => {
        // Arrange
        fixture.componentInstance.errors.set( [ { kind: 'required' } ] )

        // Act
        const error: string = errorOfElement()

        // Assert
        expect( error ).toBe( '' )
    } )

    it( 'sets the translated first error on the element once the field is touched, then clears it when valid', () => {
        // Arrange
        fixture.componentInstance.errors.set( [ { kind: 'required' } ] )
        fixture.componentInstance.touched.set( true )

        // Act
        const shown: string = errorOfElement()
        fixture.componentInstance.errors.set( [] )
        const cleared: string = errorOfElement()

        // Assert
        expect( shown ).toBe( 'form.error.required' )
        expect( cleared ).toBe( '' )
    } )
} )
