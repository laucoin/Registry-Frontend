import { TestBed } from '@angular/core/testing'
import { TranslocoService } from '@jsverse/transloco'
import { beforeEach, describe, expect, it } from 'vitest'
import { PluralTranslationPipe } from './plural-translation.pipe'

describe( 'PluralTranslationPipe', () => {
    let pipe: PluralTranslationPipe

    beforeEach( () => {
        const translations: Record<string, string> = { 'zero.zero': 'none', 'zero.two': 'pair' }
        TestBed.configureTestingModule( {
            providers: [
                PluralTranslationPipe,
                { provide: TranslocoService, useValue: { getActiveLang: (): string => 'fr', getTranslation: (): object => translations } },
            ],
        } )
        pipe = TestBed.inject( PluralTranslationPipe )
    } )

    it( 'uses the zero key when it exists', () => {
        // Arrange
        const key: string = 'zero'

        // Act
        const result: string = pipe.transform( key, 0 )

        // Assert
        expect( result ).toBe( 'zero.zero' )
    } )

    it( 'falls back to the one key for zero when no zero key exists', () => {
        // Arrange
        const key: string = 'plain'

        // Act
        const result: string = pipe.transform( key, [] )

        // Assert
        expect( result ).toBe( 'plain.one' )
    } )

    it( 'uses the one key for a single element', () => {
        // Arrange
        const key: string = 'plain'

        // Act
        const result: string = pipe.transform( key, [ 'a' ] )

        // Assert
        expect( result ).toBe( 'plain.one' )
    } )

    it( 'uses the two key when it exists and falls back to few otherwise', () => {
        // Arrange
        const withTwo: string = 'zero'
        const withoutTwo: string = 'plain'

        // Act
        const existing: string = pipe.transform( withTwo, 2 )
        const missing: string = pipe.transform( withoutTwo, 2 )

        // Assert
        expect( existing ).toBe( 'zero.two' )
        expect( missing ).toBe( 'plain.few' )
    } )

    it( 'uses the few key for larger or unknown sizes', () => {
        // Arrange
        const key: string = 'plain'

        // Act
        const large: string = pipe.transform( key, 5 )
        const unknown: string = pipe.transform( key, undefined )

        // Assert
        expect( large ).toBe( 'plain.few' )
        expect( unknown ).toBe( 'plain.few' )
    } )
} )
