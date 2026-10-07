import { PageStateHelper } from './page-state.helper'
import { ErrorModel } from '@shared/models/model/error.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { GenericModel } from '@shared/models/model/generic.model'

describe( 'PageStateHelper', () => {
    it( 'builds an idle initial block', () => {
        const block: PageRequestInformationModel<{ a: number }, GenericModel> = PageStateHelper.initial<{ a: number }, GenericModel>( { a: 1 } )
        expect( block ).toEqual( { element: undefined, params: { a: 1 }, loading: false, silentLoading: false, error: undefined } )
    } )

    it( 'sets an error toast without touching the rest', () => {
        const block: PageRequestInformationModel<object, GenericModel> = PageStateHelper.initial<object, GenericModel>( {} )
        const result: PageRequestInformationModel<object, GenericModel> = PageStateHelper.withError( block, { title: 'T', message: 'M', status: 500 } as ErrorModel )
        expect( result.error?.summary ).toBe( 'T' )
        expect( result.loading ).toBe( false )
    } )
} )
