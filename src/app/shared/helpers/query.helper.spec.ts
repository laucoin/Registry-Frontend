import { describe, expect, it } from 'vitest'
import { QueryHelper } from '@shared/helpers/query.helper'

describe( 'QueryHelper', () => {
    it( 'defaults to the first page of twenty elements', () => {
        // Arrange
        const params: undefined = undefined

        // Act
        const query: string = QueryHelper.buildQueryParams( undefined, undefined, params ).toString()

        // Assert
        expect( query ).toBe( 'page=0&size=20' )
    } )

    it( 'keeps the requested page and size', () => {
        // Arrange
        const page: number = 3

        // Act
        const query: string = QueryHelper.buildQueryParams( page, 5, {} ).toString()

        // Assert
        expect( query ).toBe( 'page=3&size=5' )
    } )

    it( 'adds the defined search criteria and skips the undefined ones', () => {
        // Arrange
        const params: object = { q: 'ada', isVisible: undefined, withProfile: false }

        // Act
        const query: URLSearchParams = new URLSearchParams( QueryHelper.buildQueryParams( 0, 10, params ).toString() )

        // Assert
        expect( query.get( 'q' ) ).toBe( 'ada' )
        expect( query.get( 'withProfile' ) ).toBe( 'false' )
        expect( query.has( 'isVisible' ) ).toBe( false )
    } )

    it( 'never sends the internal reset flag', () => {
        // Arrange
        const params: object = { resetSearch: true, q: 'x' }

        // Act
        const query: URLSearchParams = new URLSearchParams( QueryHelper.buildQueryParams( 0, 10, params ).toString() )

        // Assert
        expect( query.has( 'resetSearch' ) ).toBe( false )
    } )
} )
