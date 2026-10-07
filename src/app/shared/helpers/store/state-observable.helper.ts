import { inject, Injector } from '@angular/core'
import { StateSource, watchState } from '@ngrx/signals'
import { distinctUntilChanged, Observable, Subscriber, TeardownLogic } from 'rxjs'

// Synchronous equivalent of an NGXS `select`: emits the current value on subscribe, then on every change.
// Must be called in an injection context.
export function selectState<S extends object, T> (source: StateSource<S>, project: (state: S) => T): Observable<T> {
    const injector: Injector = inject( Injector )
    return new Observable<T>( (subscriber: Subscriber<T>): TeardownLogic => {
        const ref: { destroy (): void } = watchState( source, (state: S): void => subscriber.next( project( state ) ), { injector } )
        return (): void => ref.destroy()
    } ).pipe( distinctUntilChanged() )
}
