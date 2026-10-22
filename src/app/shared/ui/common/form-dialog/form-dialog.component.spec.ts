import { ComponentFixture, TestBed } from '@angular/core/testing'
import { TranslocoTestingModule } from '@jsverse/transloco'
import { Mock, describe, expect, it, vi } from 'vitest'
import { UiFacade } from '@core/registry/state/ui.facade'
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component'

describe( 'FormDialogComponent', () => {
    function create (inputs: Record<string, unknown> = {}, tinyScreen: boolean = false): ComponentFixture<FormDialogComponent> {
        TestBed.configureTestingModule( {
            imports: [ FormDialogComponent, TranslocoTestingModule.forRoot( { langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } } ) ],
            providers: [ { provide: UiFacade, useValue: { tinyScreen: (): boolean => tinyScreen } } ],
        } )
        const fixture: ComponentFixture<FormDialogComponent> = TestBed.createComponent( FormDialogComponent )
        fixture.componentRef.setInput( 'submitLabel', 'global.actions.edit' )
        fixture.componentRef.setInput( 'title', 'Edit' )
        Object.entries( inputs ).forEach( ([ name, value ]: [ string, unknown ]): void => fixture.componentRef.setInput( name, value ) )
        fixture.detectChanges()
        return fixture
    }

    it( 'puts the dialog inside a form so that the submit button and Enter submit it', () => {
        // Arrange
        const fixture: ComponentFixture<FormDialogComponent> = create()

        // Act
        const dialog: Element | null = fixture.nativeElement.querySelector( 'form > sgdf-dialog' )
        const submit: Element | null = fixture.nativeElement.querySelector( 'sgdf-button[submit]' )

        // Assert
        expect( dialog ).not.toBeNull()
        expect( submit ).not.toBeNull()
    } )

    it( 'asks the page to submit when the form is submitted', () => {
        // Arrange
        const fixture: ComponentFixture<FormDialogComponent> = create()
        const submitted: Mock<() => void> = vi.fn()
        fixture.componentInstance.submitted.subscribe( submitted )

        // Act
        fixture.nativeElement.querySelector( 'form' ).dispatchEvent( new Event( 'submit', { cancelable: true } ) )

        // Assert
        expect( submitted ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'asks the page to close from the cancel button and from the dialog itself, but not from a nested element', () => {
        // Arrange
        const fixture: ComponentFixture<FormDialogComponent> = create()
        const closed: Mock<() => void> = vi.fn()
        fixture.componentInstance.closed.subscribe( closed )
        const dialog: HTMLElement = fixture.nativeElement.querySelector( 'sgdf-dialog' )

        // Act
        fixture.nativeElement.querySelector( 'sgdf-button[variant="neutral"]' ).dispatchEvent( new MouseEvent( 'click' ) )
        dialog.dispatchEvent( new Event( 'sgdf-hide' ) )
        const nested: HTMLElement = document.createElement( 'div' )
        dialog.appendChild( nested )
        nested.dispatchEvent( new Event( 'sgdf-hide', { bubbles: true } ) )

        // Assert
        expect( closed ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'shows a spinner instead of the fields while loading and disables the submit button', () => {
        // Arrange
        const fixture: ComponentFixture<FormDialogComponent> = create( { loading: true } )

        // Act
        const spinner: Element | null = fixture.nativeElement.querySelector( 'sgdf-spinner' )
        const submit: HTMLElement & { disabled: boolean } = fixture.nativeElement.querySelector( 'sgdf-button[submit]' )

        // Assert
        expect( spinner ).not.toBeNull()
        expect( submit.disabled ).toBe( true )
    } )

    it( 'takes the whole screen on a small one', () => {
        // Arrange
        const fixture: ComponentFixture<FormDialogComponent> = create( {}, true )

        // Act
        const fullscreen: boolean = fixture.nativeElement.querySelector( 'sgdf-dialog' ).classList.contains( 'dialog-fullscreen' )

        // Assert
        expect( fullscreen ).toBe( true )
    } )
} )
