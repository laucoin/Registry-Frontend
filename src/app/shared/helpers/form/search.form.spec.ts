import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import { createSearchForm, SearchModel, toSearchModel, toSearchParams } from '@shared/helpers/form/search.form'

interface Search {
    q: string | undefined
    at: Date | undefined
    isVisible: boolean | undefined
}

const WHEN: Date = new Date( 2026, 5, 1 )

describe( 'search form', () => {
    it( 'gives blank texts and null values to the parameters that are not set', () => {
        // Arrange
        const params: Search = { q: undefined, at: undefined, isVisible: undefined }

        // Act
        const model: SearchModel<Search> = toSearchModel( params, [ 'q' ] )

        // Assert
        expect( model ).toEqual( { q: '', at: null, isVisible: null } )
    } )

    it( 'keeps the parameters that are set, including false', () => {
        // Arrange
        const params: Search = { q: 'ada', at: WHEN, isVisible: false }

        // Act
        const model: SearchModel<Search> = toSearchModel( params, [ 'q' ] )

        // Assert
        expect( model ).toEqual( params )
    } )

    it( 'turns blank texts and nulls back into unset parameters', () => {
        // Arrange
        const model: SearchModel<Search> = { q: '', at: null, isVisible: false }

        // Act
        const params: Search = toSearchParams<Search>( model )

        // Assert
        expect( params ).toEqual( { q: undefined, at: undefined, isVisible: false } )
    } )

    it( 'exposes every search parameter as a field of the model', () => {
        // Arrange
        const model: WritableSignal<SearchModel<Search>> = signal( toSearchModel<Search>( { q: 'a', at: undefined, isVisible: undefined }, [ 'q' ] ) )
        const tree: FieldTree<SearchModel<Search>> = TestBed.runInInjectionContext( () => createSearchForm( model ) )

        // Act
        tree.q().value.set( 'b' )

        // Assert
        expect( model().q ).toBe( 'b' )
    } )
} )
