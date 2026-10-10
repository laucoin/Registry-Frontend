import { catchError, defer, EMPTY, finalize, Observable, ReplaySubject, throwError } from 'rxjs'
import { WritableSignal } from '@angular/core'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Shared RxJS operators for stores and facades.
 * Scope: Reports errors (toast or global state), scopes loading flags and swallows errors so streams stay alive.
 * Limits: Does not retry or cache.
 */
export interface ErrorSink {
    setGlobalError (error: ErrorModel): void

    notify (message: NotificationModel): void
}

export const initialize = (onSubscribe: () => void) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    onSubscribe()
    return source
} )

export const withLoading = (loading: WritableSignal<boolean>) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    loading.set( true )
    return source.pipe( finalize( (): void => loading.set( false ) ) )
} )

export const reportError = (errorSink: ErrorSink, error: ErrorModel): void => {
    if (error.status === 503) {
        errorSink.setGlobalError( error )
    } else {
        errorSink.notify( {
            severity: SeverityEnum.ERROR,
            summary: error.title,
            detail: error.message,
            icon: 'pi pi-exclamation-triangle',
            closable: true,
            sticky: true,
        } )
    }
}

// Reports the error (toast, or full-page state on 503) and completes without emitting.
export const notifyOnError = (errorSink: ErrorSink) => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (error: ErrorModel): Observable<never> => {
        reportError( errorSink, error )
        return EMPTY
    } ),
)

// For forms: only a 503 is global (completes silently); any other error is rethrown for the form to display.
export const notifyUnavailableOnly = (errorSink: ErrorSink) => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (error: ErrorModel): Observable<never> => {
        if (error.status !== 503) {
            return throwError( (): ErrorModel => error )
        }
        reportError( errorSink, error )
        return EMPTY
    } ),
)

// Runs the source right away and replays its outcome, like a dispatched action: callers may ignore or chain on the result.
export const eager = <T> (source: Observable<T>): Observable<T> => {
    const result: ReplaySubject<T> = new ReplaySubject<T>()
    source.subscribe( result )
    return result.asObservable()
}
