import { describe, it, expect } from 'vitest'
import { PageStateHelper } from './page-state.helper'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { GenericModel } from '@shared/models/model/generic.model'

describe( 'PageStateHelper', () => {
    it( 'builds an idle initial block', () => {
        // Arrange
        const params: { a: number } = { a: 1 }

        // Act
        const block: PageRequestInformationModel<{ a: number }, GenericModel> = PageStateHelper.initial<{ a: number }, GenericModel>( params )

        // Assert
        expect( block ).toEqual( { element: undefined, params: params, loading: false, silentLoading: false, error: undefined } )
    } )

    it( 'sets an error toast without touching the rest', () => {
        // Arrange
        const block: PageRequestInformationModel<object, GenericModel> = PageStateHelper.initial<object, GenericModel>( {} )
        const error: ErrorModel = { title: 'T', message: 'M', status: 500 } as ErrorModel

        // Act
        const result: PageRequestInformationModel<object, GenericModel> = PageStateHelper.withError( block, error )

        // Assert
        expect( result.error?.summary ).toBe( 'T' )
        expect( result.loading ).toBe( false )
    } )
} )
