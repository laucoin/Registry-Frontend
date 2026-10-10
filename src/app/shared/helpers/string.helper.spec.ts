import { describe, expect, it } from 'vitest'
import { RegistryRouteEnum } from '@core/routing/registry-route.enum'
import { RouteHelper } from '@shared/helpers/route.helper'
import { StringHelper } from '@shared/helpers/string.helper'

describe( 'StringHelper', () => {
    it( 'appends a cache-busting parameter with the right separator', () => {
        // Arrange
        const plain: string = 'settings/config.json'
        const withQuery: string = 'settings/config.json?lang=fr'

        // Act
        const first: string = StringHelper.addCacheBustingToUrl( plain )
        const second: string = StringHelper.addCacheBustingToUrl( withQuery )

        // Assert
        expect( first ).toMatch( /^settings\/config\.json\?cache-bust=/ )
        expect( second ).toMatch( /^settings\/config\.json\?lang=fr&cache-bust=/ )
    } )

    it.each( [
        [ undefined, 5, '', '' ],
        [ 'short', 10, '', 'short' ],
        [ 'a long sentence', 6, '', 'a long' ],
        [ 'a long sentence', 6, '…', 'a long…' ],
    ] )( 'truncates %s to %i characters', (text: string | undefined, max: number, tail: string, expected: string) => {
        // Arrange
        const input: string | undefined = text

        // Act
        const result: string = StringHelper.truncate( input, max, tail )

        // Assert
        expect( result ).toBe( expected )
    } )

    it( 'tells blank from missing text', () => {
        // Arrange
        const samples: (string | undefined)[] = [ undefined, '', '   ', 'x' ]

        // Act
        const blank: boolean[] = samples.map( (text: string | undefined): boolean => StringHelper.isBlank( text ) )
        const nullOrBlank: boolean[] = samples.map( (text: string | undefined): boolean => StringHelper.isNullOrBlank( text ) )
        const notNullNorBlank: boolean[] = samples.map( (text: string | undefined): boolean => StringHelper.isNotNullNorBlank( text ) )

        // Assert
        expect( blank ).toEqual( [ false, true, true, false ] )
        expect( nullOrBlank ).toEqual( [ true, true, true, false ] )
        expect( notNullNorBlank ).toEqual( [ false, false, false, true ] )
    } )

    it( 'converts numbers and numeric strings but leaves missing values undefined', () => {
        // Arrange
        const samples: (number | string | null | undefined)[] = [ 12, '34', null, undefined ]

        // Act
        const results: (number | undefined)[] = samples.map( (value: number | string | null | undefined): number | undefined => StringHelper.toNumber( value ) )

        // Assert
        expect( results ).toEqual( [ 12, 34, undefined, undefined ] )
    } )

    it( 'pads digits to the requested width', () => {
        // Arrange
        const value: number = 7

        // Act
        const padded: string = StringHelper.formatDigits( value, 3 )

        // Assert
        expect( padded ).toBe( '007' )
    } )

    it( 'formats on at least two digits without cutting longer numbers', () => {
        // Arrange
        const samples: (number | undefined)[] = [ 5, 42, 100, undefined ]

        // Act
        const results: string[] = samples.map( (num: number | undefined): string => StringHelper.formatAtLeastOnTwoDigits( num ) )

        // Assert
        expect( results ).toEqual( [ '05', '42', '100', '' ] )
    } )

    it( 'title-cases every word and tolerates empty text', () => {
        // Arrange
        const text: string = 'jEAN-pierre DUPONT'

        // Act
        const result: string = StringHelper.toTitleCase( text )

        // Assert
        expect( result ).toBe( 'Jean-pierre Dupont' )
        expect( StringHelper.toTitleCase( undefined ) ).toBe( '' )
    } )

    it( 'marks a route active when the current path contains it', () => {
        // Arrange
        const pathname: string = '/projects/2f1c0d8e-aaaa-bbbb-cccc-1234567890ab/movements'

        // Act
        const active: boolean = StringHelper.isRouteActive( RegistryRouteEnum.PROJECTS, pathname )

        // Assert
        expect( active ).toBe( true )
    } )

    it( 'does not mark the users route active on the profiles, invitations or settings pages', () => {
        // Arrange
        const pathnames: string[] = [ RouteHelper.absolute( RegistryRouteEnum.USERS_PROFILES ), RouteHelper.absolute( RegistryRouteEnum.USERS_INVITATIONS ), RouteHelper.absolute( RegistryRouteEnum.USERS_SETTINGS ) ]

        // Act
        const results: boolean[] = pathnames.map( (pathname: string): boolean => StringHelper.isRouteActive( RegistryRouteEnum.USERS, pathname ) )

        // Assert
        expect( results ).toEqual( [ false, false, false ] )
    } )
} )
