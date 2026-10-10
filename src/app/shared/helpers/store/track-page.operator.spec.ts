import { TestBed } from '@angular/core/testing'
import { Subject } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ErrorModel } from '@shared/models/model/error.model'
import { TestPageBlock, TestPageStore } from '@shared/helpers/store/testing/test-page.store'
import { PageSlice, trackPage } from '@shared/helpers/store/track-page.operator'

describe( 'track-page operator', () => {
    let store: InstanceType<typeof TestPageStore>
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let uiFacade: UiFacade
    let slice: PageSlice<TestPageBlock>

    beforeEach( () => {
        store = TestBed.inject( TestPageStore )
        setGlobalError = vi.fn()
        uiFacade = { setGlobalError: setGlobalError, notify: vi.fn() } as unknown as UiFacade
        slice = store.itemsSlice()
    } )

    it( 'reads and writes the targeted block of the store', () => {
        // Arrange
        const block: TestPageBlock = { ...slice.read(), loading: true }

        // Act
        slice.write( block )

        // Assert
        expect( store.items().loading ).toBe( true )
        expect( slice.read() ).toEqual( block )
    } )

    it( 'flags the block as loading while the request is in flight', () => {
        // Arrange
        const source: Subject<string> = new Subject<string>()
        source.pipe( trackPage( uiFacade, slice ) ).subscribe()

        // Act
        const loadingWhileInFlight: boolean = store.items().loading
        source.complete()

        // Assert
        expect( loadingWhileInFlight ).toBe( true )
        expect( store.items().loading ).toBe( false )
    } )

    it( 'stores a non-503 error in the block and completes without emitting', () => {
        // Arrange
        const source: Subject<string> = new Subject<string>()
        const emitted: string[] = []
        const completed: Mock<() => void> = vi.fn()
        source.pipe( trackPage( uiFacade, slice ) ).subscribe( { next: (value: string): number => emitted.push( value ), complete: completed } )

        // Act
        source.error( { status: 500, title: 'Title', message: 'Message' } as ErrorModel )

        // Assert
        expect( store.items().error?.summary ).toBe( 'Title' )
        expect( store.items().loading ).toBe( false )
        expect( emitted ).toEqual( [] )
        expect( completed ).toHaveBeenCalledTimes( 1 )
    } )

    it( 'reports a 503 globally instead of storing it in the block', () => {
        // Arrange
        const source: Subject<string> = new Subject<string>()
        const error: ErrorModel = { status: 503, title: 'Down', message: 'Down' } as ErrorModel
        source.pipe( trackPage( uiFacade, slice ) ).subscribe()

        // Act
        source.error( error )

        // Assert
        expect( setGlobalError ).toHaveBeenCalledWith( error )
        expect( store.items().error ).toBeUndefined()
    } )
} )
