import { signal, WritableSignal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FieldTree } from '@angular/forms/signals'
import { describe, expect, it } from 'vitest'
import { createUserForm, toUserFormModel, UserFormModel } from '@pages/users/user-form/user.form'
import { UserModel } from '@shared/models/model/user.model'

describe( 'user form', () => {
    it.each( [
        [ undefined, { role: '' } ],
        [ { role: undefined }, { role: '' } ],
        [ { role: { label: 'Admin', value: 'ADMIN' } }, { role: 'ADMIN' } ],
    ] )( 'maps %j to the model %j', (user: object | undefined, expected: UserFormModel) => {
        // Arrange
        const source: UserModel | undefined = user as UserModel | undefined

        // Act
        const model: UserFormModel = toUserFormModel( source )

        // Assert
        expect( model ).toEqual( expected )
    } )

    it( 'requires a role', () => {
        // Arrange
        const model: WritableSignal<UserFormModel> = signal( toUserFormModel() )
        const tree: FieldTree<UserFormModel> = TestBed.runInInjectionContext( () => createUserForm( model ) )

        // Act
        const whenEmpty: string[] = tree.role().errors().map( (error: { kind: string }): string => error.kind )
        model.set( { role: 'ADMIN' } )

        // Assert
        expect( [ whenEmpty, tree.role().errors() ] ).toEqual( [ [ 'required' ], [] ] )
    } )
} )
