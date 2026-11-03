import { convertToParamMap, ParamMap, Params } from '@angular/router'
import { parseSearchQuery, SearchQuerySchema, serializeSearchQuery } from '@shared/helpers/search/search-query'
import { BooleanChoice } from '@shared/helpers/form/boolean-choice'
import { describe, expect, it } from 'vitest'

interface TestModel {
    q: string
    at: Date | null
    isFavorite: BooleanChoice
}

const schema: SearchQuerySchema<TestModel> = { q: 'text', at: 'date', isFavorite: 'choice' }
const defaults: TestModel = { q: '', at: null, isFavorite: '' }

describe( 'search query', () => {
    it( 'reads every field of the schema from the url', () => {
        // Arrange
        const query: ParamMap = convertToParamMap( { q: 'camp', at: '2026-01-02T00:00:00.000Z', isFavorite: 'true', other: 'x' } )

        // Act
        const model: TestModel = parseSearchQuery( schema, defaults, query )

        // Assert
        expect( model ).toEqual( { q: 'camp', at: new Date( '2026-01-02T00:00:00.000Z' ), isFavorite: 'true' } )
    } )

    it( 'falls back to the defaults for absent or invalid values', () => {
        // Arrange
        const query: ParamMap = convertToParamMap( { at: 'not-a-date', isFavorite: 'maybe' } )

        // Act
        const model: TestModel = parseSearchQuery( schema, defaults, query )

        // Assert
        expect( model ).toEqual( defaults )
    } )

    it( 'removes the fields equal to their default from the url', () => {
        // Arrange
        const model: TestModel = { q: 'camp', at: null, isFavorite: 'false' }

        // Act
        const params: Params = serializeSearchQuery( schema, defaults, model )

        // Assert
        expect( params ).toEqual( { q: 'camp', at: null, isFavorite: 'false' } )
        expect( serializeSearchQuery( schema, defaults, defaults ) ).toEqual( { q: null, at: null, isFavorite: null } )
    } )

    it( 'writes a date as an ISO string', () => {
        // Arrange
        const model: TestModel = { ...defaults, at: new Date( '2026-01-02T00:00:00.000Z' ) }

        // Act
        const params: Params = serializeSearchQuery( schema, defaults, model )

        // Assert
        expect( params['at'] ).toBe( '2026-01-02T00:00:00.000Z' )
    } )

    it( 'only accepts the values listed by an enumerated field', () => {
        // Arrange
        const listed: SearchQuerySchema<TestModel> = { q: [ 'camp', 'raid' ] }

        // Act
        const accepted: TestModel = parseSearchQuery( listed, defaults, convertToParamMap( { q: 'raid' } ) )
        const rejected: TestModel = parseSearchQuery( listed, defaults, convertToParamMap( { q: 'other' } ) )

        // Assert
        expect( accepted.q ).toBe( 'raid' )
        expect( rejected.q ).toBe( '' )
    } )
} )
