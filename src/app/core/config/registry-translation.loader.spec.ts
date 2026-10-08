import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { Translation } from '@jsverse/transloco'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RegistryTranslationLoader } from './registry-translation.loader'

describe( 'RegistryTranslationLoader', () => {
    let loader: RegistryTranslationLoader
    let httpTesting: HttpTestingController

    beforeEach( () => {
        TestBed.configureTestingModule( { providers: [ provideHttpClient(), provideHttpClientTesting() ] } )
        loader = TestBed.inject( RegistryTranslationLoader )
        httpTesting = TestBed.inject( HttpTestingController )
    } )

    afterEach( () => httpTesting.verify() )

    it( 'fetches the translation file of the requested language', () => {
        // Arrange
        const expected: Translation = { global: { title: 'Titre' } }
        let received: Translation | undefined

        // Act
        loader.getTranslation( 'fr' ).subscribe( (translation: Translation): void => {
            received = translation
        } )
        httpTesting.expectOne( 'i18n/fr.json' ).flush( expected )

        // Assert
        expect( received ).toEqual( expected )
    } )
} )
