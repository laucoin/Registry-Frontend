import { TestBed } from '@angular/core/testing'
import { of } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures'
import {
    ITEM_SOURCE,
    ITEMS_SOURCE,
    ItemsSource,
    ItemSource,
    LABELS_SOURCE,
    LabelsSource,
    MOVEMENT_CONTENTS_API,
    MOVEMENTS_SOURCE,
    MovementsSource,
    TEST_ERRORS,
    TestPagedStore,
} from '@shared/helpers/store/testing/test-paged.store'
import { ErrorSink } from '@shared/helpers/rx.helper'
import { MovementContentsApi } from '@shared/helpers/store/paged-store.methods'
import { GenericModel } from '@shared/models/model/generic.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'

describe( 'paged store methods', () => {
    let store: InstanceType<typeof TestPagedStore>
    let itemsSource: Mock<ItemsSource>
    let movementsSource: Mock<MovementsSource>
    let itemSource: Mock<ItemSource>
    let labelsSource: Mock<LabelsSource>
    let findMovementsContents: Mock<MovementContentsApi['findMovementsContents']>
    let notify: Mock<(message: unknown) => void>

    beforeEach( () => {
        itemsSource = vi.fn()
        movementsSource = vi.fn()
        itemSource = vi.fn()
        labelsSource = vi.fn()
        findMovementsContents = vi.fn( () => of( [] ) )
        notify = vi.fn()
        TestBed.configureTestingModule( {
            providers: [
                TestPagedStore,
                { provide: ITEMS_SOURCE, useValue: itemsSource },
                { provide: MOVEMENTS_SOURCE, useValue: movementsSource },
                { provide: ITEM_SOURCE, useValue: itemSource },
                { provide: LABELS_SOURCE, useValue: labelsSource },
                { provide: TEST_ERRORS, useValue: { notify } as ErrorSink },
                { provide: MOVEMENT_CONTENTS_API, useValue: { findMovementsContents } },
            ],
        } )
        store = TestBed.inject( TestPagedStore )
    } )

    describe( 'pageFetcher merge hook', () => {
        it( 'stores the shown page merged with the fetched one', () => {
            // Arrange
            const first: ReturnType<typeof pageOf<GenericModel>> = { ...pageOf<GenericModel>( [ { id: 'a' } as GenericModel ] ), size: 1 }
            const second: ReturnType<typeof pageOf<GenericModel>> = { ...pageOf<GenericModel>( [ { id: 'b' } as GenericModel ], 1 ), size: 1 }
            itemsSource.mockReturnValueOnce( of( first ) ).mockReturnValueOnce( of( second ) )
            store.fetchAppendedItems( { n: 0 } )

            // Act
            store.fetchAppendedItems( { n: 1 } )

            // Assert
            expect( store.items.element()?.content.map( (it: GenericModel): string => it.id ) ).toEqual( [ 'a', 'b' ] )
        } )
    } )

    describe( 'pageFetcher hooks', () => {
        it( 'reads the search parameters after the before hook ran', () => {
            // Arrange
            itemsSource.mockReturnValue( of( pageOf<GenericModel>( [] ) ) )

            // Act
            store.fetchResettingItems( { n: 0 } )

            // Assert
            expect( itemsSource ).toHaveBeenCalledWith( { n: 0 }, expect.objectContaining( { text: 'reset' } ) )
        } )

        it( 'reports a hook that throws and keeps serving the next requests', () => {
            // Arrange
            itemsSource.mockReturnValue( of( pageOf<GenericModel>( [ { id: 'a' } as GenericModel ] ) ) )
            store.fetchGuardedItems( { n: -1 } )

            // Act
            store.fetchGuardedItems( { n: 1 } )

            // Assert
            expect( notify ).toHaveBeenCalledTimes( 1 )
            expect( store.items.element()?.content ).toHaveLength( 1 )
        } )
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

        it( 'keeps a 503 failure in its block', () => {
            // Arrange
            itemsSource.mockReturnValue( failing( ERROR_503 ) )

            // Act
            store.fetchItems( { n: 1 } )

            // Assert
            expect( store.items.error() ).toBeDefined()
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

    describe( 'paramsMerger', () => {
        it( 'keeps the parameters that are not given', () => {
            // Arrange
            store.updateItemsParams( { resetSearch: false, text: 'ada' } )

            // Act
            store.mergeItemsParams( { resetSearch: true } )

            // Assert
            expect( store.items.params() ).toEqual( { resetSearch: true, text: 'ada' } )
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

        it( 'fetches only the contents of the page that just arrived', () => {
            // Arrange
            movementsSource.mockReturnValueOnce( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
            movementsSource.mockReturnValueOnce( of( pageOf<MovementModel>( [ { id: 'm2' } as MovementModel ], 1 ) ) )
            store.fetchMovements( { projectId: 'p1' } )
            findMovementsContents.mockClear()

            // Act
            store.fetchMovements( { projectId: 'p1' } )

            // Assert
            expect( findMovementsContents ).toHaveBeenCalledOnce()
            expect( findMovementsContents ).toHaveBeenCalledWith( 'p1', [ 'm2' ], true )
        } )

        it( 'keeps the contents already loaded when the next page arrives', () => {
            // Arrange
            movementsSource.mockReturnValueOnce( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
            movementsSource.mockReturnValueOnce( of( pageOf<MovementModel>( [ { id: 'm2' } as MovementModel ], 1 ) ) )
            findMovementsContents.mockReturnValueOnce( of( [ { first: 'm1', second: [ { id: 'c' } as unknown as MovementContentModel ] } ] ) )
            store.fetchMovements( { projectId: 'p1' } )

            // Act
            store.fetchMovements( { projectId: 'p1' } )

            // Assert
            expect( store.movements.element()?.content[ 0 ].content ).toHaveLength( 1 )
            expect( store.movements.element()?.content[ 1 ].content ).toEqual( [] )
        } )

        it( 'does not fetch contents for an empty page', () => {
            // Arrange
            movementsSource.mockReturnValue( of( pageOf<MovementModel>( [] ) ) )

            // Act
            store.fetchMovements( { projectId: 'p1' } )

            // Assert
            expect( findMovementsContents ).not.toHaveBeenCalled()
        } )

        it( 'keeps a failed contents fetch in the section error and the page as it was', () => {
            // Arrange
            movementsSource.mockReturnValue( of( pageOf<MovementModel>( [ { id: 'm1' } as MovementModel ] ) ) )
            findMovementsContents.mockReturnValue( failing( ERROR_500 ) )

            // Act
            store.fetchMovements( { projectId: 'p1' } )

            // Assert
            expect( store.sectionErrors()[ 'contents' ]?.summary ).toBe( 'Title' )
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

        it( 'keeps a failed element fetch in the block, ends the loading state and keeps the previous element', () => {
            // Arrange
            itemSource.mockReturnValueOnce( of( { id: 'x' } as GenericModel ) )
            itemSource.mockReturnValueOnce( failing( ERROR_500 ) )
            store.fetchItem( 'x' )

            // Act
            store.fetchItem( 'y' )

            // Assert
            expect( store.item.error()?.summary ).toBe( 'Title' )
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

        it( 'keeps a failed metadata fetch in the section error and the previous list', () => {
            // Arrange
            labelsSource.mockReturnValueOnce( of( [ 'a' ] ) )
            labelsSource.mockReturnValueOnce( failing( ERROR_500 ) )
            store.fetchLabels( 'x' )

            // Act
            store.fetchLabels( 'x' )

            // Assert
            expect( store.sectionErrors()[ 'metadata.labels' ]?.summary ).toBe( 'Title' )
            expect( store.metadata.labels() ).toEqual( [ '-', 'a' ] )
        } )

        it( 'clears the section error of a metadata list when the next fetch succeeds', () => {
            // Arrange
            labelsSource.mockReturnValueOnce( failing( ERROR_500 ) )
            labelsSource.mockReturnValueOnce( of( [ 'a' ] ) )
            store.fetchLabels( 'x' )

            // Act
            store.fetchLabels( 'x' )

            // Assert
            expect( store.sectionErrors()[ 'metadata.labels' ] ).toBeUndefined()
            expect( store.metadata.labels() ).toEqual( [ '-', 'a' ] )
        } )

        it( 'clears the error of an element block when the next fetch succeeds', () => {
            // Arrange
            itemSource.mockReturnValueOnce( failing( ERROR_500 ) )
            itemSource.mockReturnValueOnce( of( { id: 'y' } as GenericModel ) )
            store.fetchItem( 'x' )

            // Act
            store.fetchItem( 'y' )

            // Assert
            expect( store.item.error() ).toBeUndefined()
            expect( store.item.element()?.id ).toBe( 'y' )
        } )
    } )
} )
