import { describe, expect, it } from 'vitest'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageModel } from '@shared/models/model/page.model'

const item = (id: string): GenericModel => ({ id }) as GenericModel

const page = (ids: string[], page: number, size: number, totalElements: number): PageModel<GenericModel> => ({
    page,
    size,
    totalElements,
    totalPages: Math.ceil( totalElements / size ),
    content: ids.map( item ),
    lastRefresh: new Date(),
})

describe( 'CumulativePageHelper', () => {
    describe( 'merge', () => {
        it( 'appends the batch that follows the shown page', () => {
            // Arrange
            const current: PageModel<GenericModel> = page( [ 'a', 'b' ], 0, 2, 5 )
            const fetched: PageModel<GenericModel> = page( [ 'c', 'd' ], 1, 2, 5 )

            // Act
            const merged: PageModel<GenericModel> = CumulativePageHelper.merge( current, fetched, { page: 1, size: 2 } )

            // Assert
            expect( merged.content.map( (it: GenericModel): string => it.id ) ).toEqual( [ 'a', 'b', 'c', 'd' ] )
            expect( merged.page ).toBe( 1 )
            expect( merged.size ).toBe( 2 )
        } )

        it( 'replaces the shown page when the first batch is requested again', () => {
            // Arrange
            const current: PageModel<GenericModel> = page( [ 'a', 'b', 'c', 'd' ], 1, 2, 5 )
            const fetched: PageModel<GenericModel> = page( [ 'x', 'y' ], 0, 2, 2 )

            // Act
            const merged: PageModel<GenericModel> = CumulativePageHelper.merge( current, fetched, { page: 0, size: 2 } )

            // Assert
            expect( merged ).toBe( fetched )
        } )

        it( 'uses the fetched page when nothing is shown yet', () => {
            // Arrange
            const fetched: PageModel<GenericModel> = page( [ 'a' ], 0, 2, 1 )

            // Act
            const merged: PageModel<GenericModel> = CumulativePageHelper.merge( undefined, fetched, { page: undefined, size: undefined } )

            // Assert
            expect( merged ).toBe( fetched )
        } )

        it( 'rebuilds the shown batches from a reload request', () => {
            // Arrange
            const fetched: PageModel<GenericModel> = page( [ 'a', 'b', 'c' ], 0, 4, 5 )

            // Act
            const merged: PageModel<GenericModel> = CumulativePageHelper.merge( undefined, fetched, { page: 0, size: 4, batchSize: 2 } )

            // Assert
            expect( merged.size ).toBe( 2 )
            expect( merged.page ).toBe( 1 )
            expect( merged.totalPages ).toBe( 3 )
        } )

        it( 'keeps one batch when a reload comes back empty', () => {
            // Arrange
            const fetched: PageModel<GenericModel> = page( [], 0, 4, 0 )

            // Act
            const merged: PageModel<GenericModel> = CumulativePageHelper.merge( undefined, fetched, { page: 0, size: 4, batchSize: 2 } )

            // Assert
            expect( merged.page ).toBe( 0 )
        } )
    } )

    describe( 'reloadRequest', () => {
        it( 'asks for every shown batch in one request', () => {
            // Arrange
            const current: PageModel<GenericModel> = page( [ 'a', 'b', 'c', 'd' ], 1, 2, 5 )

            // Act
            const request: ReturnType<typeof CumulativePageHelper.reloadRequest> = CumulativePageHelper.reloadRequest( current )

            // Assert
            expect( request ).toEqual( { page: 0, size: 4, batchSize: 2 } )
        } )

        it( 'asks for the default first batch when nothing is shown', () => {
            // Arrange
            const current: PageModel<GenericModel> | undefined = undefined

            // Act
            const request: ReturnType<typeof CumulativePageHelper.reloadRequest> = CumulativePageHelper.reloadRequest( current )

            // Assert
            expect( request ).toEqual( { page: undefined, size: undefined } )
        } )
    } )

    describe( 'hasMore', () => {
        it( 'is true while batches remain', () => {
            // Arrange
            const current: PageModel<GenericModel> = page( [ 'a', 'b' ], 0, 2, 5 )

            // Act
            const hasMore: boolean = CumulativePageHelper.hasMore( current )

            // Assert
            expect( hasMore ).toBe( true )
        } )

        it( 'is false on the last batch or without a page', () => {
            // Arrange
            const last: PageModel<GenericModel> = page( [ 'e' ], 2, 2, 5 )

            // Act
            const results: boolean[] = [ CumulativePageHelper.hasMore( last ), CumulativePageHelper.hasMore( undefined ) ]

            // Assert
            expect( results ).toEqual( [ false, false ] )
        } )
    } )
} )
