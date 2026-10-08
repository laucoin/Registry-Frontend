import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import {
    ITEM_SOURCE,
    ITEMS_SOURCE,
    ItemsSource,
    ItemSource,
    LABELS_SOURCE,
    LabelsSource,
    MOVEMENTS_SOURCE,
    MovementsSource,
    TEST_ERRORS,
    TestPagedStore,
} from '@shared/helpers/store/testing/test-paged.store'
import { ErrorSink } from '@shared/helpers/rx.helper'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'

describe( 'paged store methods', () => {
    let store: InstanceType<typeof TestPagedStore>
    let itemsSource: Mock<ItemsSource>
    let movementsSource: Mock<MovementsSource>
    let itemSource: Mock<ItemSource>
    let labelsSource: Mock<LabelsSource>
    let findMovementsContents: Mock<MovementApi['findMovementsContents']>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        itemsSource = vi.fn()
        movementsSource = vi.fn()
        itemSource = vi.fn()
        labelsSource = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        setGlobalError = vi.fn()
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                TestPagedStore,
                { provide: ITEMS_SOURCE, useValue: itemsSource },
                { provide: MOVEMENTS_SOURCE, useValue: movementsSource },
                { provide: ITEM_SOURCE, useValue: itemSource },
                { provide: LABELS_SOURCE, useValue: labelsSource },
                { provide: TEST_ERRORS, useValue: { setGlobalError, notify } as ErrorSink },
                { provide: MovementApi, useValue: { findMovementsContents } },
            ],
        } )
        store = TestBed.inject( TestPagedStore )
    } )

    describe( 'pageFetcher', () => {
        it( 'runs the source with the request and the current search parameters', () => {
            // Arrange
            itemsSource.mockReturnValue( of( pageOf<GenericModel>( [] ) ) )

            // Act
            store.fetchItems( { n: 3 } )

            // Assert
            expect( itemsSource ).toHaveBeenCalledWith( { n: 3 }, expect.objectContaining( { text: undefined } ) )
        } )

        it( 'stores the page, clears the reset flag and ends the loading state', () => {
            // Arrange
            const page: ReturnType<typeof pageOf<GenericModel>> = pageOf<GenericModel>( [ { id: 'a' } as GenericModel ] )
            itemsSource.mockReturnValue( of( page ) )

            // Act
            store.fetchItems( { n: 1 } )

            // Assert
            expect( store.items.element() ).toEqual( page )
            expect( store.items.params.resetSearch() ).toBe( false )
            expect( store.items.loading() ).toBe( false )
        } )

        it( 'keeps a failure in the block of the resource and stays usable', () => {
            // Arrange
            itemsSource.mockReturnValueOnce( failing( ERROR_500 ) )
            itemsSource.mockReturnValueOnce( of( pageOf<GenericModel>( [] ) ) )
            store.fetchItems( { n: 1 } )
            const keptError: string | undefined = store.items.error()?.summary

            // Act
            store.fetchItems( { n: 2 } )

            // Assert
            expect( keptError ).toBe( 'Title' )
            expect( store.items.element() ).toBeDefined()
        } )

        it( 'reports a 503 globally instead of keeping it in the block', () => {
            // Arrange
            itemsSource.mockReturnValue( failing( ERROR_503 ) )

            // Act
            store.fetchItems( { n: 1 } )

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
            expect( store.items.error() ).toBeUndefined()
        } )
    } )

    describe( 'paramsUpdater', () => {
        it( 'swaps the search parameters and keeps the rest of the block', () => {
            // Arrange
            itemsSource.mockReturnValue( of( pageOf<GenericModel>( [ { id: 'a' } as GenericModel ] ) ) )
            store.fetchItems( { n: 1 } )

            // Act
            store.updateItemsParams( { resetSearch: true, text: 'ada' } )

            // Assert
            expect( store.items.params() ).toEqual( { resetSearch: true, text: 'ada' } )
            expect( store.items.element() ).toBeDefined()
        } )
    } )

    describe( 'movement contents', () => {
        it( 'fetches the contents of a loaded page and merges them by movement', () => {
            // Arrange
            movementsSource.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel, { id: 'm2' } as MovementModel ] ) ) )
            findMovementsContents.mockReturnValue( of( [ { first: 'm2', second: [ { id: 'c' } as unknown as MovementContentModel ] } ] ) )

            // Act
            store.fetchMovements( { projectId: 'p1' } )

            // Assert
            expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm1', 'm2' ], true )
            expect( store.movements.element()?.content[ 0 ].content ).toEqual( [] )
            expect( store.movements.element()?.content[ 1 ].content ).toHaveLength( 1 )
        } )

        it( 'does not fetch contents for an empty page', () => {
            // Arrange
            movementsSource.mockReturnValue( of( pageOf<MovementModel>( [] ) ) )

            // Act
            store.fetchMovements( { projectId: 'p1' } )

            // Assert
            expect( findMovementsContents ).not.toHaveBeenCalled()
        } )

        it( 'notifies a failed contents fetch and keeps the page as it was', () => {
            // Arrange
            movementsSource.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
            findMovementsContents.mockReturnValue( failing( ERROR_500 ) )

            // Act
            store.fetchMovements( { projectId: 'p1' } )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
            expect( store.movements.element()?.content[ 0 ].id ).toBe( 'm1' )
        } )

        it( 'ignores contents that arrive when no page is stored', () => {
            // Arrange
            findMovementsContents.mockReturnValue( of( [ { first: 'm1', second: [] } ] ) )

            // Act
            store.fetchContents( { projectId: 'p1', movementIds: [ 'm1' ] } )

            // Assert
            expect( store.movements.element() ).toBeUndefined()
        } )
    } )

    describe( 'element and metadata builders', () => {
        it( 'loads an element and ends its loading state', () => {
            // Arrange
            itemSource.mockReturnValue( of( { id: 'x' } as GenericModel ) )

            // Act
            store.fetchItem( 'x' )

            // Assert
            expect( store.item.element()?.id ).toBe( 'x' )
            expect( store.item.loading() ).toBe( false )
        } )

        it( 'notifies a failed element fetch, ends the loading state and keeps the previous element', () => {
            // Arrange
            itemSource.mockReturnValueOnce( of( { id: 'x' } as GenericModel ) )
            itemSource.mockReturnValueOnce( failing( ERROR_500 ) )
            store.fetchItem( 'x' )

            // Act
            store.fetchItem( 'y' )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { summary: 'Title' } ) )
            expect( store.item.loading() ).toBe( false )
            expect( store.item.element()?.id ).toBe( 'x' )
        } )

        it( 'toggles the element loader by hand', () => {
            // Arrange
            store.startItemLoader()
            const running: boolean = store.item.loading()

            // Act
            store.stopItemLoader()

            // Assert
            expect( running ).toBe( true )
            expect( store.item.loading() ).toBe( false )
        } )

        it( 'stores a transformed metadata list', () => {
            // Arrange
            labelsSource.mockReturnValue( of( [ 'a', 'b' ] ) )

            // Act
            store.fetchLabels( 'x' )

            // Assert
            expect( store.metadata.labels() ).toEqual( [ '-', 'a', 'b' ] )
        } )

        it( 'notifies a failed metadata fetch and keeps the previous list', () => {
            // Arrange
            labelsSource.mockReturnValueOnce( of( [ 'a' ] ) )
            labelsSource.mockReturnValueOnce( failing( ERROR_500 ) )
            store.fetchLabels( 'x' )

            // Act
            store.fetchLabels( 'x' )

            // Assert
            expect( notify ).toHaveBeenCalledTimes( 1 )
            expect( store.metadata.labels() ).toEqual( [ '-', 'a' ] )
        } )
    } )
} )
