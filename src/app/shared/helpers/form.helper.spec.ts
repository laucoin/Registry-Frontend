import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms'
import { describe, expect, it } from 'vitest'
import { FormHelper } from '@shared/helpers/form.helper'

describe( 'FormHelper', () => {
    it( 'marks nested controls dirty and reports whether the form is valid', () => {
        // Arrange
        const name: FormControl<string | null> = new FormControl<string | null>( '', Validators.required )
        const child: FormControl<string | null> = new FormControl<string | null>( '', Validators.required )
        const form: FormGroup = new FormGroup( { name, nested: new FormGroup( { child } ) } )

        // Act
        const valid: boolean = FormHelper.isFormValid( form )

        // Assert
        expect( valid ).toBe( false )
        expect( name.dirty ).toBe( true )
        expect( child.dirty ).toBe( true )
    } )

    it( 'marks the controls of a form array and its groups dirty', () => {
        // Arrange
        const item: FormControl<string | null> = new FormControl<string | null>( '' )
        const groupItem: FormControl<string | null> = new FormControl<string | null>( '' )
        const form: FormGroup = new FormGroup( { list: new FormArray( [ item, new FormGroup( { groupItem } ) ] ) } )

        // Act
        FormHelper.markAllControlsAsDirty( form )

        // Assert
        expect( item.dirty ).toBe( true )
        expect( groupItem.dirty ).toBe( true )
    } )

    it( 'builds an empty, single or full date range', () => {
        // Arrange
        const start: string = '2026-01-01'
        const end: string = '2026-01-05'

        // Act
        const none: Date[] = FormHelper.buildDateRange( undefined, end )
        const single: Date[] = FormHelper.buildDateRange( start, undefined )
        const full: Date[] = FormHelper.buildDateRange( start, end )

        // Assert
        expect( none ).toEqual( [] )
        expect( single ).toEqual( [ new Date( start ) ] )
        expect( full ).toEqual( [ new Date( start ), new Date( end ) ] )
    } )

    it( 'only reports an error code once the control was touched and edited', () => {
        // Arrange
        const control: FormControl<string | null> = new FormControl<string | null>( '', Validators.required )
        const pristine: string | undefined = FormHelper.errorCode( control )

        // Act
        control.markAsDirty()
        control.markAsTouched()

        // Assert
        expect( pristine ).toBeUndefined()
        expect( FormHelper.errorCode( control ) ).toBe( 'required' )
    } )

    it( 'is not invalid before interaction and is invalid after', () => {
        // Arrange
        const control: FormControl<string | null> = new FormControl<string | null>( '', Validators.required )
        const before: boolean = FormHelper.invalid( control )

        // Act
        control.markAsTouched()

        // Assert
        expect( before ).toBe( false )
        expect( FormHelper.invalid( control ) ).toBe( true )
    } )

    it( 'revalidates a single control when marking it dirty', () => {
        // Arrange
        const control: FormControl<string | null> = new FormControl<string | null>( 'x' )

        // Act
        FormHelper.markControlsAsDirty( control )

        // Assert
        expect( control.dirty ).toBe( true )
    } )
} )
