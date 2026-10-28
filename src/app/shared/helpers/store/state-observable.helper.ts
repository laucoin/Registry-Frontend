import { inject, Injector } from '@angular/core'
import { StateSource, watchState } from '@ngrx/signals'
import { distinctUntilChanged, Observable, Subscriber, TeardownLogic } from 'rxjs'

/**
 * Purpose: Expose une projection de l'état d'un signal store sous forme d'Observable qui émet de façon synchrone à l'abonnement.
 * Scope: Relie les signal stores aux consommateurs RxJS comme les guards de route.
 * Limits: Doit être appelé dans un contexte d'injection ; ne modifie pas l'état.
 */
export function selectState<S extends object, T> (source: StateSource<S>, project: (state: S) => T): Observable<T> {
    const injector: Injector = inject( Injector )
    return new Observable<T>( (subscriber: Subscriber<T>): TeardownLogic => {
        const ref: { destroy (): void } = watchState( source, (state: S): void => subscriber.next( project( state ) ), { injector } )
        return (): void => ref.destroy()
    } ).pipe( distinctUntilChanged() )
}
