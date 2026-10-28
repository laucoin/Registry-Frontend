import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import { createSearchForm } from '@shared/helpers/form/search.form'

interface Search {
    q: string
    isVisible: boolean
}

describe( 'search form', () => {
    it( 'exposes every search parameter as a field of the model', () => {
        // Arrange
        const model: WritableSignal<Search> = signal( { q: 'a', isVisible: false } )
        const tree: FieldTree<Search> = TestBed.runInInjectionContext( () => createSearchForm( model ) )

        // Act
        tree.q().value.set( 'b' )

        // Assert
        expect( model().q ).toBe( 'b' )
    } )
} )
