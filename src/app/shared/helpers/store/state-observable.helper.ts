import { inject, Injector } from '@angular/core'
import { StateSource, watchState } from '@ngrx/signals'
import { distinctUntilChanged, Observable, Subscriber, TeardownLogic } from 'rxjs'

/**
 * Purpose: Exposes a projection of a signal store state as an Observable that emits synchronously on subscribe.
 * Scope: Bridges signal stores to RxJS consumers such as route guards.
 * Limits: Must be called in an injection context; it does not mutate state.
 */
export function selectState<S extends object, T> (source: StateSource<S>, project: (state: S) => T): Observable<T> {
    const injector: Injector = inject( Injector )
    return new Observable<T>( (subscriber: Subscriber<T>): TeardownLogic => {
        const ref: { destroy (): void } = watchState( source, (state: S): void => subscriber.next( project( state ) ), { injector } )
        return (): void => ref.destroy()
    } ).pipe( distinctUntilChanged() )
}
