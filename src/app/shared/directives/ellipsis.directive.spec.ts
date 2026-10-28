import { Component } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { describe, expect, it } from 'vitest'
import { EllipsisDirective } from './ellipsis.directive'

@Component( {
    imports: [ EllipsisDirective ],
    template: `<span appEllipsis>A very long name</span>`,
} )
class HostComponent {}

describe( 'EllipsisDirective', () => {
    function render (): HTMLElement {
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent( HostComponent )
        fixture.detectChanges()
        return fixture.nativeElement.querySelector( 'span' )
    }

    it( 'truncates its host on one line', () => {
        // Arrange

        // Act
        const host: HTMLElement = render()

        // Assert
        expect( host.classList ).toContain( 'truncate' )
        expect( host.classList ).toContain( 'min-w-0' )
    } )

    it( 'shows the full text as a tooltip once the host is truncated', () => {
        // Arrange
        const host: HTMLElement = render()
        Object.defineProperty( host, 'scrollWidth', { value: 200 } )
        Object.defineProperty( host, 'clientWidth', { value: 100 } )

        // Act
        host.dispatchEvent( new Event( 'mouseenter' ) )

        // Assert
        expect( host.title ).toBe( 'A very long name' )
    } )

    it( 'shows no tooltip when the text fits', () => {
        // Arrange
        const host: HTMLElement = render()
        Object.defineProperty( host, 'scrollWidth', { value: 100 } )
        Object.defineProperty( host, 'clientWidth', { value: 100 } )

        // Act
        host.dispatchEvent( new Event( 'mouseenter' ) )

        // Assert
        expect( host.title ).toBe( '' )
    } )
} )
