import { signal, WritableSignal } from '@angular/core'
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { UiFacade } from '@core/registry/state/ui.facade'
import { eager, initialize, notifyOnError, notifyUnavailableOnly, reportError, withLoading } from '@shared/helpers/rx.helper'
import { ERROR_500, ERROR_503 } from '@shared/helpers/testing/test-fixtures'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'
import { ErrorModel } from '@shared/models/model/error.model'

describe( 'rx helpers', () => {
    let setGlobalError: Mock<(error: ErrorModel) => void>
    let notify: Mock<(message: unknown) => void>
    let uiFacade: UiFacade

    beforeEach( () => {
        setGlobalError = vi.fn()
        notify = vi.fn()
        uiFacade = { setGlobalError, notify } as unknown as UiFacade
    } )

    describe( 'reportError', () => {
        it( 'turns a 503 into the global error', () => {
            // Arrange
            const error: ErrorModel = ERROR_503

            // Act
            reportError( uiFacade, error )

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( error )
            expect( notify ).not.toHaveBeenCalled()
        } )

        it( 'shows any other error as a sticky error toast', () => {
            // Arrange
            const error: ErrorModel = ERROR_500

            // Act
            reportError( uiFacade, error )

            // Assert
            expect( notify ).toHaveBeenCalledWith( expect.objectContaining( { severity: SeverityEnum.ERROR, summary: 'Title', detail: 'Message', sticky: true } ) )
            expect( setGlobalError ).not.toHaveBeenCalled()
        } )
    } )

    describe( 'notifyOnError', () => {
        it( 'lets values through untouched', () => {
            // Arrange
            const received: number[] = []

            // Act
            of( 1, 2 ).pipe( notifyOnError( uiFacade ) ).subscribe( (value: number): number => received.push( value ) )

            // Assert
            expect( received ).toEqual( [ 1, 2 ] )
            expect( notify ).not.toHaveBeenCalled()
        } )

        it( 'reports the error and completes without emitting', () => {
            // Arrange
            let completed: boolean = false
            const received: number[] = []

            // Act
            throwError( (): ErrorModel => ERROR_500 ).pipe( notifyOnError( uiFacade ) ).subscribe( { next: (value: never): number => received.push( value ), complete: (): void => { completed = true } } )

            // Assert
            expect( notify ).toHaveBeenCalledTimes( 1 )
            expect( received ).toEqual( [] )
            expect( completed ).toBe( true )
        } )
    } )

    describe( 'notifyUnavailableOnly', () => {
        it( 'rethrows an error other than 503 for the form to display', () => {
            // Arrange
            let received: ErrorModel | undefined

            // Act
            throwError( (): ErrorModel => ERROR_500 ).pipe( notifyUnavailableOnly( uiFacade ) ).subscribe( { error: (error: ErrorModel): void => { received = error } } )

            // Assert
            expect( received ).toBe( ERROR_500 )
            expect( notify ).not.toHaveBeenCalled()
        } )

        it( 'reports a 503 globally and completes silently', () => {
            // Arrange
            let completed: boolean = false

            // Act
            throwError( (): ErrorModel => ERROR_503 ).pipe( notifyUnavailableOnly( uiFacade ) ).subscribe( { complete: (): void => { completed = true } } )

            // Assert
            expect( setGlobalError ).toHaveBeenCalledWith( ERROR_503 )
            expect( completed ).toBe( true )
        } )
    } )

    describe( 'initialize', () => {
        it( 'runs the callback when the source is subscribed, not when the pipe is built', () => {
            // Arrange
            const onSubscribe: Mock<() => void> = vi.fn()
            const piped: ReturnType<typeof EMPTY.pipe> = EMPTY.pipe( initialize( onSubscribe ) )
            const calledBeforeSubscribe: number = onSubscribe.mock.calls.length

            // Act
            piped.subscribe()

            // Assert
            expect( calledBeforeSubscribe ).toBe( 0 )
            expect( onSubscribe ).toHaveBeenCalledTimes( 1 )
        } )
    } )

    describe( 'withLoading', () => {
        it( 'raises the flag while the source is in flight and lowers it on completion', () => {
            // Arrange
            const loading: WritableSignal<boolean> = signal( false )
            const source: Subject<number> = new Subject<number>()
            source.pipe( withLoading( loading ) ).subscribe()
            const whileRunning: boolean = loading()

            // Act
            source.complete()

            // Assert
            expect( whileRunning ).toBe( true )
            expect( loading() ).toBe( false )
        } )

        it( 'lowers the flag when the source fails', () => {
            // Arrange
            const loading: WritableSignal<boolean> = signal( false )

            // Act
            throwError( (): Error => new Error( 'x' ) ).pipe( withLoading( loading ) ).subscribe( { error: (): void => undefined } )

            // Assert
            expect( loading() ).toBe( false )
        } )
    } )

    describe( 'eager', () => {
        it( 'runs the source without any subscriber', () => {
            // Arrange
            const run: Mock<() => void> = vi.fn()
            const source: Observable<number> = of( 1 ).pipe( initialize( run ) )

            // Act
            eager( source )

            // Assert
            expect( run ).toHaveBeenCalledTimes( 1 )
        } )

        it( 'replays the outcome to a late subscriber', () => {
            // Arrange
            const emitted: number[] = []
            const result: Observable<number> = eager( of( 7 ) )

            // Act
            result.subscribe( (value: number): number => emitted.push( value ) )

            // Assert
            expect( emitted ).toEqual( [ 7 ] )
        } )
    } )
} )
