import { Location } from '@angular/common'
import { Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { Router } from '@angular/router'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BackNavigationDirective } from '@shared/directives/back-navigation.directive'

@Component( {
    imports: [ BackNavigationDirective ],
    template: '<div appBackNavigation></div>',
} )
class HostComponent {}

describe( 'BackNavigationDirective', () => {
    let back: Mock<() => void>
    let navigateByUrl: Mock<(url: string) => Promise<boolean>>
    let state: unknown

    function emitBack (): void {
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        fixture.nativeElement.querySelector( 'div' ).dispatchEvent( new CustomEvent( 'sgdf-back' ) )
    }

    beforeEach( () => {
        back = vi.fn()
        navigateByUrl = vi.fn( () => Promise.resolve( true ) )
        state = { navigationId: 1 }
        TestBed.configureTestingModule( {
            providers: [
                { provide: Location, useValue: { back, getState: (): unknown => state } },
                { provide: Router, useValue: { navigateByUrl } },
            ],
        } )
    } )

    it( 'goes back in the history when the page is not the entry point', () => {
        // Arrange
        state = { navigationId: 3 }

        // Act
        emitBack()

        // Assert
        expect( back ).toHaveBeenCalledTimes( 1 )
        expect( navigateByUrl ).not.toHaveBeenCalled()
    } )

    it( 'goes to the root when the page is the entry point', () => {
        // Arrange
        state = { navigationId: 1 }

        // Act
        emitBack()

        // Assert
        expect( navigateByUrl ).toHaveBeenCalledWith( '/' )
        expect( back ).not.toHaveBeenCalled()
    } )
} )
