import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { UiStore } from '@core/registry/state/ui.store'
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures'
import { ThemeEnum } from '@shared/models/enumeration/theme.enum'

describe( 'UiStore', () => {
    let store: InstanceType<typeof UiStore>
    let setRootTheme: Mock<(theme: ThemeEnum) => void>
    let setRootLanguage: Mock<(language: string) => void>
    let systemTheme: ThemeEnum
    let readCookie: Mock<(name: string) => string | undefined>
    let writeCookie: Mock<(name: string, value: string, maxAge: number) => void>
    let resize: (width: number) => void
    let stopResize: Mock<() => void>

    function createStore (): InstanceType<typeof UiStore> {
        TestBed.configureTestingModule( {
            providers: [
                {
                    provide: BrowserService,
                    useValue: {
                        get systemTheme (): ThemeEnum { return systemTheme },
                        viewportWidth: 1024,
                        setRootTheme,
                        readCookie,
                        writeCookie,
                        setRootLanguage,
                        onViewportResize: (listener: (width: number) => void): (() => void) => { resize = listener; return stopResize },
                    },
                },
            ],
        } )
        return TestBed.inject( UiStore )
    }

    beforeEach( () => {
        setRootTheme = vi.fn()
        readCookie = vi.fn( (): string | undefined => undefined )
        writeCookie = vi.fn()
        setRootLanguage = vi.fn()
        stopResize = vi.fn()
        systemTheme = ThemeEnum.LIGHT
    } )

    it( 'starts with the system theme and the current viewport width', () => {
        // Arrange
        systemTheme = ThemeEnum.DARK

        // Act
        store = createStore()

        // Assert
        expect( store.theme() ).toBe( ThemeEnum.DARK )
        expect( store.screenWidth() ).toBe( 1024 )
        expect( store.error() ).toBeUndefined()
    } )

    it( 'applies the dark theme on the document', () => {
        // Arrange
        store = createStore()

        // Act
        store.updateTheme( ThemeEnum.DARK )

        // Assert
        expect( setRootTheme ).toHaveBeenCalledWith( ThemeEnum.DARK )
        expect( store.theme() ).toBe( ThemeEnum.DARK )
    } )

    it( 'applies the light theme on the document even when the system is dark', () => {
        // Arrange
        systemTheme = ThemeEnum.DARK
        store = createStore()

        // Act
        store.updateTheme( ThemeEnum.LIGHT )

        // Assert
        expect( setRootTheme ).toHaveBeenCalledWith( ThemeEnum.LIGHT )
    } )

    it( 'hands the system theme over to the document', () => {
        // Arrange
        systemTheme = ThemeEnum.DARK
        store = createStore()

        // Act
        store.updateTheme( ThemeEnum.SYSTEM )

        // Assert
        expect( setRootTheme ).toHaveBeenCalledWith( ThemeEnum.SYSTEM )
        expect( store.theme() ).toBe( ThemeEnum.SYSTEM )
    } )

    it( 'tracks the language being saved until the change stops', () => {
        // Arrange
        store = createStore()

        // Act
        store.startLanguageChange( 'en' )
        const pending: string | undefined = store.pendingLanguage()
        store.stopLanguageChange()

        // Assert
        expect( pending ).toBe( 'en' )
        expect( store.pendingLanguage() ).toBeUndefined()
    } )

    it( 'builds the global error toast from the error title and message', () => {
        // Arrange
        store = createStore()

        // Act
        store.setGlobalError( ERROR_500 )

        // Assert
        expect( store.error() ).toEqual( expect.objectContaining( { severity: 'error', summary: 'Title', detail: 'Message', closable: true } ) )
    } )

    it( 'keeps the first global error', () => {
        // Arrange
        store = createStore()
        store.setGlobalError( ERROR_500 )

        // Act
        store.setGlobalError( Object.assign( new Error(), ERROR_500, { title: 'Other' } ) )

        // Assert
        expect( store.error() ).toEqual( expect.objectContaining( { summary: 'Title' } ) )
    } )

    it( 'tracks the network state', () => {
        // Arrange
        store = createStore()

        // Act
        store.updateNetwork( false )

        // Assert
        expect( store.online() ).toBe( false )
    } )

    it( 'follows the viewport width when the window is resized', () => {
        // Arrange
        store = createStore()

        // Act
        resize( 500 )

        // Assert
        expect( store.screenWidth() ).toBe( 500 )
    } )

    it( 'stops following the viewport when the store is destroyed', () => {
        // Arrange
        store = createStore()

        // Act
        TestBed.resetTestingModule()

        // Assert
        expect( stopResize ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'starts with the theme remembered in the cookie and applies it on the document', () => {
        // Arrange
        readCookie.mockReturnValue( ThemeEnum.DARK )
        systemTheme = ThemeEnum.LIGHT

        // Act
        store = createStore()

        // Assert
        expect( store.theme() ).toBe( ThemeEnum.DARK )
        expect( setRootTheme ).toHaveBeenCalledWith( ThemeEnum.DARK )
    } )

    it( 'falls back to the system theme and leaves the document untouched when the cookie is unknown', () => {
        // Arrange
        readCookie.mockReturnValue( 'unknown' )
        systemTheme = ThemeEnum.DARK

        // Act
        store = createStore()

        // Assert
        expect( store.theme() ).toBe( ThemeEnum.DARK )
        expect( setRootTheme ).not.toHaveBeenCalled()
    } )

    it( 'remembers the chosen theme in a cookie', () => {
        // Arrange
        store = createStore()

        // Act
        store.updateTheme( ThemeEnum.LIGHT )

        // Assert
        expect( writeCookie ).toHaveBeenCalledWith( 'registry-theme', ThemeEnum.LIGHT, 31536000 )
    } )
} )
