import { convertToParamMap } from '@angular/router'
import { DEFAULT_SORT, formatSort, parseSort, SortFields, sortQueryCodec } from '@shared/helpers/search/sort-query'
import { describe, expect, it } from 'vitest'

const ALLOWED: readonly string[] = [ 'name', 'begin' ]

describe( 'sort query', () => {
    it.each<[ string | null, SortFields ]>( [
        [ 'name', { sortBy: 'name', sortDirection: 'asc' } ],
        [ '-begin', { sortBy: 'begin', sortDirection: 'desc' } ],
        [ 'other', DEFAULT_SORT ],
        [ '-other', DEFAULT_SORT ],
        [ '', DEFAULT_SORT ],
        [ null, DEFAULT_SORT ],
    ] )( 'reads the sort "%s" from the url', (raw: string | null, expected: SortFields) => {
        // Arrange
        // Act
        const sort: SortFields = parseSort( raw, ALLOWED )

        // Assert
        expect( sort ).toEqual( expected )
    } )

    it.each<[ SortFields, string | undefined ]>( [
        [ { sortBy: 'name', sortDirection: 'asc' }, 'name' ],
        [ { sortBy: 'name', sortDirection: 'desc' }, '-name' ],
        [ { sortBy: '', sortDirection: 'desc' }, undefined ],
    ] )( 'writes %j as the backend sort', (fields: SortFields, expected: string | undefined) => {
        // Arrange
        // Act
        const sort: string | undefined = formatSort( fields )

        // Assert
        expect( sort ).toBe( expected )
    } )

    it( 'carries the sort of the model through the sort query param', () => {
        // Arrange
        const codec: ReturnType<typeof sortQueryCodec<SortFields>> = sortQueryCodec<SortFields>( ALLOWED )

        // Act
        const read: SortFields = codec.read( convertToParamMap( { sort: '-name' } ), DEFAULT_SORT )

        // Assert
        expect( read ).toEqual( { sortBy: 'name', sortDirection: 'desc' } )
        expect( codec.write( read ) ).toEqual( { sort: '-name' } )
        expect( codec.write( DEFAULT_SORT ) ).toEqual( { sort: null } )
    } )
} )
