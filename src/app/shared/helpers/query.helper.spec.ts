import { describe, expect, it } from 'vitest'
import { QueryHelper } from '@shared/helpers/query.helper'

describe( 'QueryHelper', () => {
    it( 'defaults to the first page of twenty elements', () => {
        // Arrange
        const params: undefined = undefined

        // Act
        const query: string = QueryHelper.buildQueryParams( undefined, undefined, params ).toString()

        // Assert
        expect( query ).toBe( 'pageNumber=0&pageSize=20' )
    } )

    it( 'keeps the requested page and size', () => {
        // Arrange
        const pageNumber: number = 3

        // Act
        const query: string = QueryHelper.buildQueryParams( pageNumber, 5, {} ).toString()

        // Assert
        expect( query ).toBe( 'pageNumber=3&pageSize=5' )
    } )

    it( 'adds the defined search criteria and skips the undefined ones', () => {
        // Arrange
        const params: object = { textSearched: 'ada', visibilitySearched: undefined, withProfile: false }

        // Act
        const query: URLSearchParams = new URLSearchParams( QueryHelper.buildQueryParams( 0, 10, params ).toString() )

        // Assert
        expect( query.get( 'textSearched' ) ).toBe( 'ada' )
        expect( query.get( 'withProfile' ) ).toBe( 'false' )
        expect( query.has( 'visibilitySearched' ) ).toBe( false )
    } )

    it( 'never sends the internal reset flag', () => {
        // Arrange
        const params: object = { resetSearch: true, textSearched: 'x' }

        // Act
        const query: URLSearchParams = new URLSearchParams( QueryHelper.buildQueryParams( 0, 10, params ).toString() )

        // Assert
        expect( query.has( 'resetSearch' ) ).toBe( false )
    } )
} )
