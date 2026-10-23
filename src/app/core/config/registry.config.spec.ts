import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { ApplicationInitStatus } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BrowserService } from '@core/browser/browser.service'
import { TranslocoService } from '@jsverse/transloco'
import { RegistryConfig } from '@core/config/registry.config'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ConfigModel } from '@core/config/model/config.model'
import { EnvironmentModel } from '@core/config/model/environment.model'
import { of, throwError } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface RegistryConfigInternals {
    loading: Promise<unknown> | undefined
    load: () => Promise<unknown>
    resolveLocale: (browser: Partial<BrowserService>) => string
}

const echoKey: TranslocoService['translate'] = ((key: string): string => key) as TranslocoService['translate']

function configureStartup (setGlobalError: ReturnType<typeof vi.fn>): void {
    const translocoService: Partial<TranslocoService> = { getActiveLang: (): string => 'fr', load: () => of( {} ), translate: echoKey }
    TestBed.configureTestingModule( {
        providers: [
            provideHttpClient(),
            provideHttpClientTesting(),
            { provide: UiFacade, useValue: { setGlobalError } },
            { provide: BrowserService, useValue: { preferredLanguages: [ 'fr' ], setRootLanguage: vi.fn(), readCookie: (): undefined => undefined, writeCookie: vi.fn() } },
            ...RegistryConfig.provideTranslatorService(),
            { provide: TranslocoService, useValue: translocoService },
        ],
    } )
}

describe( 'RegistryConfig', () => {
    const internals: RegistryConfigInternals = RegistryConfig as unknown as RegistryConfigInternals
    const CONFIG: ConfigModel = { defaultLanguage: 'fr', languages: [ 'fr', 'en' ], application: { name: 'Registry' } } as unknown as ConfigModel
    const ENVIRONMENT: EnvironmentModel = { production: true } as unknown as EnvironmentModel

    function fakeBrowser (remembered: string | undefined, preferredLanguages: string[]): Partial<BrowserService> {
        return { readCookie: (): string | undefined => remembered, writeCookie: vi.fn(), preferredLanguages }
    }

    function stubFetch (ok: boolean = true): void {
        vi.stubGlobal( 'fetch', vi.fn( (url: string) => Promise.resolve( {
            ok,
            status: ok ? 200 : 404,
            json: (): Promise<unknown> => Promise.resolve( url.startsWith( 'settings/config.json' ) ? CONFIG : ENVIRONMENT ),
        } ) ) )
    }

    beforeEach( () => {
        internals.loading = undefined
        RegistryConfig.config = CONFIG
    } )

    afterEach( () => {
        vi.unstubAllGlobals()
    } )

    it( 'loads the configuration and the environment from the settings files', async () => {
        // Arrange
        stubFetch()

        // Act
        await internals.load()

        // Assert
        expect( RegistryConfig.config.defaultLanguage ).toBe( 'fr' )
        expect( RegistryConfig.config.application.version ).toBeDefined()
        expect( RegistryConfig.environment ).toEqual( ENVIRONMENT )
    } )

    it( 'fetches the config and the environment once each when loaded twice', async () => {
        // Arrange
        stubFetch()

        // Act
        await Promise.all( [ internals.load(), internals.load() ] )

        // Assert
        expect( fetch ).toHaveBeenCalledTimes( 2 )
    } )

    it( 'rejects when a settings file cannot be fetched', async () => {
        // Arrange
        stubFetch( false )

        // Act
        const loading: Promise<unknown> = internals.load()

        // Assert
        await expect( loading ).rejects.toThrow( 'Unable to load settings/config.json (404)' )
    } )

    it( 'keeps the language remembered in the cookie when it is available', () => {
        // Arrange
        const browser: Partial<BrowserService> = fakeBrowser( 'en', [ 'fr' ] )

        // Act
        const locale: string = internals.resolveLocale( browser )

        // Assert
        expect( locale ).toBe( 'en' )
    } )

    it( 'forgets a remembered language that is no longer available', () => {
        // Arrange
        const browser: Partial<BrowserService> = fakeBrowser( 'de', [ 'en' ] )

        // Act
        const locale: string = internals.resolveLocale( browser )

        // Assert
        expect( locale ).toBe( 'en' )
    } )

    it( 'falls back on the default language when no preferred language is available', () => {
        // Arrange
        const browser: Partial<BrowserService> = fakeBrowser( undefined, [ 'de', 'es' ] )

        // Act
        const locale: string = internals.resolveLocale( browser )

        // Assert
        expect( locale ).toBe( 'fr' )
    } )

    it( 'resolves a regional preferred language to its base language', () => {
        // Arrange
        const browser: Partial<BrowserService> = fakeBrowser( undefined, [ 'en-GB', 'fr' ] )

        // Act
        const locale: string = internals.resolveLocale( browser )

        // Assert
        expect( locale ).toBe( 'en' )
    } )

    it( 'activates the resolved language and applies it on the root element once initialized', async () => {
        // Arrange
        stubFetch()
        const setRootLanguage: ReturnType<typeof vi.fn> = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: BrowserService, useValue: { preferredLanguages: [ 'en' ], setRootLanguage, readCookie: (): undefined => undefined, writeCookie: vi.fn() } },
                ...RegistryConfig.provideTranslatorService(),
            ],
        } )
        const httpTesting: HttpTestingController = TestBed.inject( HttpTestingController )

        // Act
        const initialized: Promise<void> = TestBed.inject( ApplicationInitStatus ).donePromise
        await vi.waitFor( (): void => { httpTesting.expectOne( 'i18n/en.json' ).flush( {} ) } )
        await initialized

        // Assert
        expect( TestBed.inject( TranslocoService ).getActiveLang() ).toBe( 'en' )
        expect( setRootLanguage ).toHaveBeenCalledWith( 'en' )
    } )

    it( 'loads the settings before the application starts', async () => {
        // Arrange
        stubFetch()
        TestBed.configureTestingModule( { providers: [ RegistryConfig.provideRuntimeConfig() ] } )

        // Act
        await TestBed.inject( ApplicationInitStatus ).donePromise

        // Assert
        expect( RegistryConfig.environment ).toEqual( ENVIRONMENT )
    } )

    it( 'falls back on a neutral configuration and reports the error when the settings cannot be loaded', async () => {
        // Arrange
        stubFetch( false )
        const setGlobalError: ReturnType<typeof vi.fn> = vi.fn()
        RegistryConfig.config = undefined as unknown as ConfigModel
        RegistryConfig.environment = undefined as unknown as EnvironmentModel
        configureStartup( setGlobalError )

        // Act
        await TestBed.inject( ApplicationInitStatus ).donePromise

        // Assert
        expect( RegistryConfig.config.defaultLanguage ).toBe( 'fr' )
        expect( RegistryConfig.environment.backend.url ).toBe( 'about:blank' )
        expect( setGlobalError ).toHaveBeenCalledWith( expect.objectContaining( { title: 'global.notifications.startup.title' } ) )
    } )

    it( 'reports the error and keeps the application starting when the translations cannot be loaded', async () => {
        // Arrange
        stubFetch()
        const setGlobalError: ReturnType<typeof vi.fn> = vi.fn()
        const translocoService: Partial<TranslocoService> = { getActiveLang: (): string => 'en', load: () => throwError( (): Error => new Error( 'boom' ) ), translate: echoKey }
        TestBed.configureTestingModule( {
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: UiFacade, useValue: { setGlobalError } },
                { provide: BrowserService, useValue: { preferredLanguages: [ 'en' ], setRootLanguage: vi.fn(), readCookie: (): undefined => undefined, writeCookie: vi.fn() } },
                ...RegistryConfig.provideTranslatorService(),
                { provide: TranslocoService, useValue: translocoService },
            ],
        } )

        // Act
        await TestBed.inject( ApplicationInitStatus ).donePromise

        // Assert
        expect( setGlobalError ).toHaveBeenCalledTimes( 1 )
    } )
} )
