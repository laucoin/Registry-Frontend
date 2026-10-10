import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import { createSearchForm, SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

interface Search {
    textSearched: string | undefined
    dateTimeSearched: Date | undefined
    visibilitySearched: boolean | undefined
}

const WHEN: Date = new Date( 2026, 5, 1 )

describe( 'search form', () => {
    it( 'gives blank texts and null values to the parameters that are not set', () => {
        // Arrange
        const params: Search = { textSearched: undefined, dateTimeSearched: undefined, visibilitySearched: undefined }

        // Act
        const model: SearchModel<Search> = toSearchModel( params, [ 'textSearched' ] )

        // Assert
        expect( model ).toEqual( { textSearched: '', dateTimeSearched: null, visibilitySearched: null } )
    } )

    it( 'keeps the parameters that are set, including false', () => {
        // Arrange
        const params: Search = { textSearched: 'ada', dateTimeSearched: WHEN, visibilitySearched: false }

        // Act
        const model: SearchModel<Search> = toSearchModel( params, [ 'textSearched' ] )

        // Assert
        expect( model ).toEqual( params )
    } )

    it( 'turns blank texts and nulls back into unset parameters', () => {
        // Arrange
        const model: SearchModel<Search> = { textSearched: '', dateTimeSearched: null, visibilitySearched: false }

        // Act
        const params: Search = toSearchParams<Search>( model )

        // Assert
        expect( params ).toEqual( { textSearched: undefined, dateTimeSearched: undefined, visibilitySearched: false } )
    } )

    it( 'exposes every search parameter as a field of the model', () => {
        // Arrange
        const model: WritableSignal<SearchModel<Search>> = signal( toSearchModel<Search>( { textSearched: 'a', dateTimeSearched: undefined, visibilitySearched: undefined }, [ 'textSearched' ] ) )
        const tree: FieldTree<SearchModel<Search>> = TestBed.runInInjectionContext( () => createSearchForm( model ) )

        // Act
        tree.textSearched().value.set( 'b' )

        // Assert
        expect( model().textSearched ).toBe( 'b' )
    } )
} )
