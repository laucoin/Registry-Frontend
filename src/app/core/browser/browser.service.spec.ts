import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

interface FakeQuery {
    matches: boolean
    addEventListener: (type: string, listener: () => void) => void
}

describe( 'BrowserService', () => {
    let service: BrowserService
    const originalMatchMedia: typeof window.matchMedia | undefined = window.matchMedia

    beforeEach( () => {
        service = TestBed.inject( BrowserService )
    } )

    afterEach( () => {
        window.matchMedia = originalMatchMedia as typeof window.matchMedia
        document.documentElement.className = ''
        document.documentElement.removeAttribute( 'lang' )
        document.body.innerHTML = ''
        vi.useRealTimers()
    } )

    it( 'redirects the window to the given url', () => {
        // Arrange
        const target: string = '#redirected'

        // Act
        service.redirect( target )

        // Assert
        expect( location.hash ).toBe( target )
    } )

    it( 'reloads the page', () => {
        // Arrange
        const reload: Mock = vi.fn()
        vi.stubGlobal( 'location', { reload } )

        // Act
        service.reload()

        // Assert
        expect( reload ).toHaveBeenCalledOnce()
        vi.unstubAllGlobals()
    } )

    it( 'exposes the current location', () => {
        // Arrange
        const expectedOrigin: string = window.location.origin

        // Act
        const origin: string = service.origin

        // Assert
        expect( origin ).toBe( expectedOrigin )
        expect( service.pathname ).toBe( window.location.pathname )
        expect( service.host ).toBe( window.location.host )
    } )

    it.each( [
        [ ThemeEnum.DARK, 'dark' ],
        [ ThemeEnum.LIGHT, 'light' ],
        [ ThemeEnum.SYSTEM, null ],
    ] )( 'applies the %s theme on the root element', (theme: ThemeEnum, expected: string | null) => {
        // Arrange
        document.documentElement.setAttribute( 'data-theme', 'dark' )

        // Act
        service.setRootTheme( theme )

        // Assert
        expect( document.documentElement.getAttribute( 'data-theme' ) ).toBe( expected )
    } )

    it( 'sets the language of the root element', () => {
        // Arrange
        const language: string = 'fr'

        // Act
        service.setRootLanguage( language )

        // Assert
        expect( document.documentElement.lang ).toBe( 'fr' )
    } )

    it( 'reports the dark system theme when the light scheme does not match', () => {
        // Arrange
        const query: FakeQuery = { matches: false, addEventListener: (): void => undefined }
        window.matchMedia = ((): FakeQuery => query) as unknown as typeof window.matchMedia
        const fresh: BrowserService = new BrowserService()

        // Act
        const theme: ThemeEnum = fresh.systemTheme

        // Assert
        expect( theme ).toBe( ThemeEnum.DARK )
    } )

    it( 'falls back to the light theme when the browser cannot tell the color scheme', () => {
        // Arrange
        window.matchMedia = undefined as unknown as typeof window.matchMedia
        const fresh: BrowserService = new BrowserService()

        // Act
        const theme: ThemeEnum = fresh.systemTheme

        // Assert
        expect( theme ).toBe( ThemeEnum.LIGHT )
    } )

    it( 'notifies the listener when the system theme changes', () => {
        // Arrange
        const addEventListener: Mock<(type: string, listener: () => void) => void> = vi.fn()
        window.matchMedia = ((): FakeQuery => ({ matches: true, addEventListener }) ) as unknown as typeof window.matchMedia
        const fresh: BrowserService = new BrowserService()
        const listener: () => void = vi.fn()

        // Act
        fresh.onSystemThemeChange( listener )

        // Assert
        expect( addEventListener ).toHaveBeenCalledWith( 'change', listener )
    } )

    it( 'highlights an element by its data value then removes the highlight', () => {
        // Arrange
        vi.useFakeTimers()
        document.body.innerHTML = '<div data-value="42"></div>'
        const element: Element = document.querySelector( '[data-value="42"]' )!

        // Act
        service.highlightByDataValue( '42' )
        const highlighted: boolean = element.classList.contains( 'highlight' )
        vi.advanceTimersByTime( 1000 )

        // Assert
        expect( highlighted ).toBe( true )
        expect( element.classList.contains( 'highlight' ) ).toBe( false )
    } )

    it( 'ignores a highlight request for a missing element', () => {
        // Arrange
        document.body.innerHTML = ''

        // Act
        const call: () => void = (): void => service.highlightByDataValue( 'missing' )

        // Assert
        expect( call ).not.toThrow()
    } )
} )
