import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { ApplicationInitStatus } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BrowserService } from '@core/browser/browser.service'
import { TranslocoService } from '@jsverse/transloco'
import { RegistryConfig } from '@core/config/registry.config'
import { ConfigModel } from '@core/config/model/config.model'
import { EnvironmentModel } from '@core/config/model/environment.model'
import { LocalStorageUtils } from '@shared/helpers/local-storage.helper'
import { LOCALE } from '@shared/helpers/request.helper'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface RegistryConfigInternals {
    loading: Promise<unknown> | undefined
    load: () => Promise<unknown>
    resolveLocale: (preferredLanguages: readonly string[]) => string
}

describe( 'RegistryConfig', () => {
    const internals: RegistryConfigInternals = RegistryConfig as unknown as RegistryConfigInternals
    const CONFIG: ConfigModel = { defaultLanguage: 'fr', languages: [ 'fr', 'en' ], application: { name: 'Registry' } } as unknown as ConfigModel
    const ENVIRONMENT: EnvironmentModel = { production: true } as unknown as EnvironmentModel

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
        localStorage.clear()
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

    it( 'keeps the language remembered in the local storage when it is available', () => {
        // Arrange
        LocalStorageUtils.set( LOCALE, 'en' )

        // Act
        const locale: string = internals.resolveLocale( [ 'fr' ] )

        // Assert
        expect( locale ).toBe( 'en' )
    } )

    it( 'forgets a remembered language that is no longer available', () => {
        // Arrange
        LocalStorageUtils.set( LOCALE, 'de' )

        // Act
        const locale: string = internals.resolveLocale( [ 'en' ] )

        // Assert
        expect( locale ).toBe( 'en' )
    } )

    it( 'falls back on the default language when no preferred language is available', () => {
        // Arrange
        const preferredLanguages: string[] = [ 'de', 'es' ]

        // Act
        const locale: string = internals.resolveLocale( preferredLanguages )

        // Assert
        expect( locale ).toBe( 'fr' )
    } )

    it( 'activates the resolved language and applies it on the root element once initialized', async () => {
        // Arrange
        stubFetch()
        const setRootLanguage: ReturnType<typeof vi.fn> = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: BrowserService, useValue: { preferredLanguages: [ 'en' ], setRootLanguage } },
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
} )
