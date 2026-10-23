import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { Mock, describe, expect, it, vi } from 'vitest'
import { FormActionsComponent } from '@shared/ui/common/form-actions/form-actions.component'

describe( 'FormActionsComponent', () => {
    function create (inputs: Record<string, unknown> = {}): ComponentFixture<FormActionsComponent> {
        TestBed.configureTestingModule( { imports: [ FormActionsComponent, TranslocoTestingModule.forRoot( { langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } } ) ] } )
        const fixture: ComponentFixture<FormActionsComponent> = TestBed.createComponent( FormActionsComponent )
        fixture.componentRef.setInput( 'submitLabel', 'global.actions.create' )
        Object.entries( inputs ).forEach( ([ name, value ]: [ string, unknown ]): void => fixture.componentRef.setInput( name, value ) )
        fixture.detectChanges()
        return fixture
    }

    it( 'offers a cancel button and a submit button that submits the surrounding form', () => {
        // Arrange
        const fixture: ComponentFixture<FormActionsComponent> = create()

        // Act
        const buttons: HTMLElement[] = Array.from( fixture.nativeElement.querySelectorAll( 'sgdf-button' ) )

        // Assert
        expect( buttons ).toHaveLength( 2 )
        expect( buttons[ 0 ].hasAttribute( 'submit' ) ).toBe( false )
        expect( buttons[ 1 ].hasAttribute( 'submit' ) ).toBe( true )
    } )

    it( 'asks the page to leave when the cancel button is clicked', () => {
        // Arrange
        const fixture: ComponentFixture<FormActionsComponent> = create()
        const cancelled: Mock<() => void> = vi.fn()
        fixture.componentInstance.cancelled.subscribe( cancelled )

        // Act
        fixture.nativeElement.querySelectorAll( 'sgdf-button' )[ 0 ].dispatchEvent( new MouseEvent( 'click' ) )

        // Assert
        expect( cancelled ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'shows the loading state of the submit button while saving', () => {
        // Arrange
        const fixture: ComponentFixture<FormActionsComponent> = create( { saving: true } )

        // Act
        const submit: HTMLElement & { loading: boolean } = fixture.nativeElement.querySelectorAll( 'sgdf-button' )[ 1 ]

        // Assert
        expect( submit.loading ).toBe( true )
    } )
} )
