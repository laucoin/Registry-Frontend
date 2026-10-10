import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { BrowserService } from '@core/browser/browser.service'
import { LanguageService } from '@core/language/language.service'
import { LocalStorageUtils } from '@shared/helpers/local-storage.helper'
import { LOCALE } from '@shared/helpers/request.helper'

describe( 'LanguageService', () => {
    let service: LanguageService
    let load: Mock
    let setActiveLang: Mock
    let setRootLanguage: Mock

    beforeEach( () => {
        load = vi.fn( () => of( {} ) )
        setActiveLang = vi.fn()
        setRootLanguage = vi.fn()
        localStorage.clear()
        TestBed.configureTestingModule( {
            providers: [
                { provide: TranslocoService, useValue: { load, setActiveLang, getActiveLang: (): string => 'fr' } },
                { provide: BrowserService, useValue: { setRootLanguage } },
            ],
        } )
        service = TestBed.inject( LanguageService )
    } )

    it( 'exposes the active language of the translations', () => {
        // Arrange

        // Act
        const language: string = service.activeLanguage

        // Assert
        expect( language ).toBe( 'fr' )
    } )

    it( 'loads then activates the language everywhere', () => {
        // Arrange

        // Act
        service.apply( 'en' ).subscribe()

        // Assert
        expect( load ).toHaveBeenCalledWith( 'en' )
        expect( setActiveLang ).toHaveBeenCalledWith( 'en' )
        expect( setRootLanguage ).toHaveBeenCalledWith( 'en' )
        expect( LocalStorageUtils.get( LOCALE ) ).toBe( 'en' )
    } )

    it( 'remembers the language without activating it', () => {
        // Arrange

        // Act
        service.remember( 'en' )

        // Assert
        expect( LocalStorageUtils.get( LOCALE ) ).toBe( 'en' )
        expect( setActiveLang ).not.toHaveBeenCalled()
    } )
} )
