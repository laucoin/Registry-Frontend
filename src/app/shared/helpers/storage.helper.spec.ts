import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageUtils } from '@shared/helpers/local-storage.helper'
import { SessionStorageUtils } from '@shared/helpers/session-storage.helper'
import { StorageUtils } from '@shared/helpers/storage.helper'

describe( 'StorageUtils', () => {
    beforeEach( () => {
        localStorage.clear()
        sessionStorage.clear()
    } )

    it( 'stores strings as they are and objects as JSON', () => {
        // Arrange
        StorageUtils.set( localStorage, 'text', 'hello' )
        StorageUtils.set( localStorage, 'object', { a: 1 } )

        // Act
        const text: unknown = StorageUtils.get( localStorage, 'text' )
        const object: unknown = StorageUtils.get( localStorage, 'object' )

        // Assert
        expect( text ).toBe( 'hello' )
        expect( object ).toEqual( { a: 1 } )
    } )

    it( 'stores nothing meaningful for a value that is neither text nor object', () => {
        // Arrange
        StorageUtils.set( localStorage, 'number', 42 )

        // Act
        const stored: unknown = StorageUtils.get( localStorage, 'number' )

        // Assert
        expect( stored ).toBe( '' )
    } )

    it( 'reports whether a key holds a value', () => {
        // Arrange
        StorageUtils.set( localStorage, 'present', 'x' )

        // Act
        const results: boolean[] = [ StorageUtils.check( localStorage, 'present' ), StorageUtils.check( localStorage, 'absent' ) ]

        // Assert
        expect( results ).toEqual( [ true, false ] )
    } )

    it( 'deletes a key', () => {
        // Arrange
        StorageUtils.set( localStorage, 'gone', 'x' )

        // Act
        StorageUtils.delete( localStorage, 'gone' )

        // Assert
        expect( StorageUtils.check( localStorage, 'gone' ) ).toBe( false )
    } )

    it( 'clears everything except the kept keys, restoring them', () => {
        // Arrange
        StorageUtils.set( localStorage, 'keep', 'k' )
        StorageUtils.set( localStorage, 'keepObject', { a: 1 } )
        StorageUtils.set( localStorage, 'drop', 'd' )

        // Act
        StorageUtils.clear( localStorage, [ 'keep', 'keepObject' ] )

        // Assert
        expect( StorageUtils.get( localStorage, 'keep' ) ).toBe( 'k' )
        expect( StorageUtils.get( localStorage, 'keepObject' ) ).toEqual( { a: 1 } )
        expect( StorageUtils.check( localStorage, 'drop' ) ).toBe( false )
    } )

    it( 'clears everything when nothing is kept', () => {
        // Arrange
        StorageUtils.set( localStorage, 'a', '1' )

        // Act
        StorageUtils.clear( localStorage )

        // Assert
        expect( localStorage.length ).toBe( 0 )
    } )

    it( 'works on the local storage through its wrapper', () => {
        // Arrange
        LocalStorageUtils.set( 'locale', 'fr' )

        // Act
        const results: unknown[] = [ LocalStorageUtils.get( 'locale' ), LocalStorageUtils.check( 'locale' ) ]
        LocalStorageUtils.delete( 'locale' )

        // Assert
        expect( results ).toEqual( [ 'fr', true ] )
        expect( localStorage.getItem( 'locale' ) ).toBeNull()
    } )

    it( 'keeps the session storage apart from the local storage', () => {
        // Arrange
        SessionStorageUtils.set( 'redirect', '/projects' )

        // Act
        const results: unknown[] = [ SessionStorageUtils.get( 'redirect' ), SessionStorageUtils.check( 'redirect' ), localStorage.getItem( 'redirect' ) ]
        SessionStorageUtils.clear( [] )

        // Assert
        expect( results ).toEqual( [ '/projects', true, null ] )
        expect( sessionStorage.length ).toBe( 0 )
    } )
} )
