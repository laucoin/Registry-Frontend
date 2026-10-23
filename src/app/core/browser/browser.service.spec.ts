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

    it( 'downloads the content as a named JSON file', () => {
        // Arrange
        const createObjectURL: Mock = vi.fn( () => 'blob:test' )
        const revokeObjectURL: Mock = vi.fn()
        vi.stubGlobal( 'URL', { createObjectURL, revokeObjectURL } )
        const click: Mock = vi.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( () => undefined )

        vi.useFakeTimers()

        // Act
        service.downloadJson( { a: 1 }, 'data.json' )
        vi.runAllTimers()
        vi.useRealTimers()

        // Assert
        expect( createObjectURL ).toHaveBeenCalledOnce()
        expect( click ).toHaveBeenCalledOnce()
        expect( revokeObjectURL ).toHaveBeenCalledWith( 'blob:test' )
        click.mockRestore()
        vi.unstubAllGlobals()
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

    it( 'exposes the viewport, the network state and the preferred languages', () => {
        // Arrange
        const expectedWidth: number = window.innerWidth

        // Act
        const width: number = service.viewportWidth

        // Assert
        expect( width ).toBe( expectedWidth )
        expect( service.online ).toBe( navigator.onLine )
        expect( service.preferredLanguages ).toBe( navigator.languages )
    } )

    it( 'reads the vertical scroll offset of the page', () => {
        // Arrange
        vi.spyOn( window, 'pageYOffset', 'get' ).mockReturnValue( 120 )

        // Act
        const offset: number = service.scrollOffset

        // Assert
        expect( offset ).toBe( 120 )
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

    it( 'highlights only the element inside the given root', () => {
        // Arrange
        vi.useFakeTimers()
        document.body.innerHTML = '<div id="a"><i data-value="42"></i></div><div id="b"><i data-value="42"></i></div>'
        const inside: Element = document.querySelector( '#b [data-value="42"]' )!
        const outside: Element = document.querySelector( '#a [data-value="42"]' )!

        // Act
        service.highlightByDataValue( '42', document.querySelector( '#b' )! )

        // Assert
        expect( inside.classList.contains( 'highlight' ) ).toBe( true )
        expect( outside.classList.contains( 'highlight' ) ).toBe( false )
    } )

    it( 'highlights an element whose data value holds selector characters', () => {
        // Arrange
        vi.useFakeTimers()
        document.body.innerHTML = '<div id="target"></div>'
        const element: Element = document.querySelector( '#target' )!
        element.setAttribute( 'data-value', 'a"b]c' )

        // Act
        service.highlightByDataValue( 'a"b]c' )

        // Assert
        expect( element.classList.contains( 'highlight' ) ).toBe( true )
    } )

    it( 'exposes the path, the query and the hash of the current location', () => {
        // Arrange
        history.replaceState( null, '', '/projects/42?tab=1#top' )

        // Act
        const relativeUrl: string = service.relativeUrl

        // Assert
        expect( relativeUrl ).toBe( '/projects/42?tab=1#top' )
    } )

    it( 'ignores a highlight request for a missing element', () => {
        // Arrange
        document.body.innerHTML = ''

        // Act
        const call: () => void = (): void => service.highlightByDataValue( 'missing' )

        // Assert
        expect( call ).not.toThrow()
    } )

    it( 'reports the viewport width each time the window is resized', () => {
        // Arrange
        const listener: (width: number) => void = vi.fn()
        service.onViewportResize( listener )

        // Act
        window.dispatchEvent( new Event( 'resize' ) )

        // Assert
        expect( listener ).toHaveBeenCalledWith( window.innerWidth )
    } )

    it( 'stops reporting the viewport width once the listener is removed', () => {
        // Arrange
        const listener: (width: number) => void = vi.fn()
        const stop: () => void = service.onViewportResize( listener )

        // Act
        stop()
        window.dispatchEvent( new Event( 'resize' ) )

        // Assert
        expect( listener ).not.toHaveBeenCalled()
    } )

    it( 'writes then reads a cookie', () => {
        // Arrange
        const name: string = 'registry-test'

        // Act
        service.writeCookie( name, 'dark mode', 60 )

        // Assert
        expect( service.readCookie( name ) ).toBe( 'dark mode' )
    } )

    it( 'reads nothing when the cookie does not exist', () => {
        // Arrange
        const name: string = 'registry-missing'

        // Act
        const value: string | undefined = service.readCookie( name )

        // Assert
        expect( value ).toBeUndefined()
    } )

    it( 'replaces the canonical link of the document', () => {
        // Arrange
        service.setCanonicalLink( 'https://registry.test/login' )

        // Act
        service.setCanonicalLink( 'https://registry.test/terms' )

        // Assert
        const links: NodeListOf<Element> = document.head.querySelectorAll( 'link[rel="canonical"]' )
        expect( links ).toHaveLength( 1 )
        expect( links[ 0 ].getAttribute( 'href' ) ).toBe( 'https://registry.test/terms' )
    } )

    it( 'removes the canonical link when no url is given', () => {
        // Arrange
        service.setCanonicalLink( 'https://registry.test/login' )

        // Act
        service.setCanonicalLink( undefined )

        // Assert
        expect( document.head.querySelector( 'link[rel="canonical"]' ) ).toBeNull()
    } )
} )
