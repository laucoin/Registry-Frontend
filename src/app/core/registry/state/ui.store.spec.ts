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

    function createStore (): InstanceType<typeof UiStore> {
        TestBed.configureTestingModule( {
            providers: [
                {
                    provide: BrowserService,
                    useValue: {
                        get systemTheme (): ThemeEnum { return systemTheme },
                        viewportWidth: 1024,
                        setRootTheme,
                        setRootLanguage,
                    },
                },
            ],
        } )
        return TestBed.inject( UiStore )
    }

    beforeEach( () => {
        setRootTheme = vi.fn()
        setRootLanguage = vi.fn()
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
        expect( store.loading() ).toBe( false )
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

    it( 'toggles the global loader', () => {
        // Arrange
        store = createStore()
        store.startGlobalLoader()
        const running: boolean = store.loading()

        // Act
        store.stopGlobalLoader()

        // Assert
        expect( running ).toBe( true )
        expect( store.loading() ).toBe( false )
    } )

    it( 'tracks the network state and the screen width', () => {
        // Arrange
        store = createStore()

        // Act
        store.updateNetwork( false )
        store.updateScreenWidth( 500 )

        // Assert
        expect( store.online() ).toBe( false )
        expect( store.screenWidth() ).toBe( 500 )
    } )
} )
