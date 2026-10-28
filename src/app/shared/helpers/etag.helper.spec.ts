import { describe, expect, it } from 'vitest'
import { ETagHelper } from '@shared/helpers/etag.helper'
import { GenericModel } from '@shared/models/model/generic.model'

describe( 'ETagHelper', () => {
    it( 'quotes the epoch milliseconds of the last edition', () => {
        // Arrange
        const element: GenericModel = { lastEdition: { dateTime: new Date( '2026-10-13T10:02:11.123456Z' ), user: undefined } } as GenericModel

        // Act
        const ifMatch: string | undefined = ETagHelper.ifMatch( element )

        // Assert
        expect( ifMatch ).toBe( '"1791885731123"' )
    } )

    it( 'accepts the date-time as the text received from the backend', () => {
        // Arrange
        const element: GenericModel = { lastEdition: { dateTime: '2026-10-13T10:02:11.123456Z', user: undefined } } as unknown as GenericModel

        // Act
        const ifMatch: string | undefined = ETagHelper.ifMatch( element )

        // Assert
        expect( ifMatch ).toBe( '"1791885731123"' )
    } )

    it( 'has no precondition without last edition', () => {
        // Arrange
        const withoutEdition: GenericModel = {} as GenericModel

        // Act
        const results: (string | undefined)[] = [ ETagHelper.ifMatch( withoutEdition ), ETagHelper.ifMatch( undefined ) ]

        // Assert
        expect( results ).toEqual( [ undefined, undefined ] )
    } )

    it( 'turns the precondition into request headers', () => {
        // Arrange
        const ifMatch: string = '"1"'

        // Act
        const withHeader: { headers?: Record<string, string> } = ETagHelper.options( ifMatch )
        const withoutHeader: { headers?: Record<string, string> } = ETagHelper.options( undefined )

        // Assert
        expect( withHeader ).toEqual( { headers: { 'If-Match': '"1"' } } )
        expect( withoutHeader ).toEqual( {} )
    } )
} )
