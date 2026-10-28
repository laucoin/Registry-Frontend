import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { FormComponent } from '@shared/ui/common/form/form.component'

describe( 'FormComponent', () => {
    let fixture: ComponentFixture<FormComponent>

    function create (inputs: Record<string, unknown>): void {
        fixture = TestBed.createComponent( FormComponent )
        Object.entries( { form: (): { touched: () => boolean } => ({ touched: (): boolean => false }), loading: false, ...inputs } )
            .forEach( ([ name, value ]: [ string, unknown ]): void => fixture.componentRef.setInput( name, value ) )
        fixture.detectChanges()
    }

    beforeEach( () => {
        TestBed.configureTestingModule( { providers: [ { provide: TranslocoService, useValue: { translate: (key: string): string => key } } ] } )
    } )

    it( 'shows its title as the level one heading of the page', () => {
        // Arrange
        const title: string = 'New group'

        // Act
        create( { title } )

        // Assert
        expect( fixture.nativeElement.querySelector( 'h1' ).textContent ).toBe( title )
        expect( fixture.nativeElement.querySelector( 'h2' ) ).toBeNull()
    } )

    it( 'shows no heading when the title is hidden', () => {
        // Arrange
        const inputs: Record<string, unknown> = { title: 'New group', showTitle: false }

        // Act
        create( inputs )

        // Assert
        expect( fixture.nativeElement.querySelector( 'h1' ) ).toBeNull()
    } )

    it( 'shows a spinner instead of the content while an untouched form loads', () => {
        // Arrange
        const inputs: Record<string, unknown> = { title: 'New group', loading: true }

        // Act
        create( inputs )

        // Assert
        expect( fixture.nativeElement.querySelector( 'sgdf-spinner' ) ).not.toBeNull()
        expect( fixture.nativeElement.querySelector( 'h1' ) ).toBeNull()
    } )
} )
