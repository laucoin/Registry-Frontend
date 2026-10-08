import { catchError, defer, EMPTY, finalize, Observable, throwError } from 'rxjs'
import { WritableSignal } from '@angular/core'
import { UiFacade } from '@core/registry/state/ui.facade'
import { ErrorModel } from '@shared/models/model/error.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Shared RxJS operators for stores and facades.
 * Scope: Reports errors (toast or global state), scopes loading flags and swallows errors so streams stay alive.
 * Limits: Does not retry or cache.
 */
export const initialize = (onSubscribe: () => void) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    onSubscribe()
    return source
} )

export const withLoading = (loading: WritableSignal<boolean>) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    loading.set( true )
    return source.pipe( finalize( (): void => loading.set( false ) ) )
} )

export const reportError = (uiFacade: UiFacade, error: ErrorModel): void => {
    if (error.status === 503) {
        uiFacade.setGlobalError( error )
    } else {
        uiFacade.notify( {
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
export const notifyOnError = (uiFacade: UiFacade) => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (error: ErrorModel): Observable<never> => {
        reportError( uiFacade, error )
        return EMPTY
    } ),
)

// For forms: only a 503 is global (completes silently); any other error is rethrown for the form to display.
export const notifyUnavailableOnly = (uiFacade: UiFacade) => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (error: ErrorModel): Observable<never> => {
        if (error.status !== 503) {
            return throwError( (): ErrorModel => error )
        }
        reportError( uiFacade, error )
        return EMPTY
    } ),
)
