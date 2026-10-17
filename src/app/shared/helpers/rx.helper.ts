import { catchError, defer, EMPTY, finalize, Observable, ReplaySubject } from 'rxjs'
import { WritableSignal } from '@angular/core'
import { NotificationModel } from '@shared/models/model/notification.model'
import { ErrorModel } from '@shared/models/model/error.model'
import { SeverityEnum } from '@shared/models/enumeration/severity.enum'

/**
 * Purpose: Contract of what stores and facades use to report a failure to the user.
 * Scope: Offers the notification toast.
 * Limits: Declares the one command only; the implementations live in the UI state.
 */
export interface ErrorSink {
    notify (message: NotificationModel): void
}

/**
 * Purpose: Runs a callback each time the source is subscribed.
 * Scope: Defers the subscription so the callback runs first.
 * Limits: Does not run anything when the source completes; use finalize for that.
 */
export const initialize = (onSubscribe: () => void) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    onSubscribe()
    return source
} )

/**
 * Purpose: Scopes a loading flag to a source.
 * Scope: Raises the flag on subscription and lowers it when the source ends, fails or is cancelled.
 * Limits: Does not handle the error; the source still fails.
 */
export const withLoading = (loading: WritableSignal<boolean>) => <T> (source: Observable<T>): Observable<T> => defer( () => {
    loading.set( true )
    return source.pipe( finalize( (): void => loading.set( false ) ) )
} )

/**
 * Purpose: Shows a failure to the user.
 * Scope: Raises a sticky error toast.
 * Limits: Does not stop or recover the stream; the caller does.
 */
export const reportError = (errorSink: ErrorSink, error: ErrorModel): void => {
    errorSink.notify( {
        severity: SeverityEnum.ERROR,
        summary: error.title ?? 'global.notifications.UNKNOWN_ERROR.title',
        detail: error.message,
        icon: 'pi pi-exclamation-triangle',
        closable: true,
        sticky: true,
    } )
}

/**
 * Purpose: Reports a failed source and completes it without emitting.
 * Scope: Shows a toast.
 * Limits: Does not retry.
 */
export const notifyOnError = (errorSink: ErrorSink) => <T> (source: Observable<T>): Observable<T> => source.pipe(
    catchError( (error: ErrorModel): Observable<never> => {
        reportError( errorSink, error )
        return EMPTY
    } ),
)

/**
 * Purpose: Runs a source right away, like a dispatched action.
 * Scope: Replays the outcome to the callers, who may ignore it or chain on it.
 * Limits: Does not cancel the source when the callers unsubscribe.
 */
export const eager = <T> (source: Observable<T>): Observable<T> => {
    const result: ReplaySubject<T> = new ReplaySubject<T>()
    source.subscribe( result )
    return result.asObservable()
}
