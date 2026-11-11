import { inject, Injector } from '@angular/core';

import { StateSource, watchState } from '@ngrx/signals';
import { distinctUntilChanged, Observable, TeardownLogic } from 'rxjs';

/**
 * Objectif: Expose une projection de l'état d'un signal store sous forme d'Observable qui émet de façon synchrone à l'abonnement.
 * Périmètre: Relie les signal stores aux consommateurs RxJS comme les guards de route.
 * Limites: Doit être appelé dans un contexte d'injection ; ne modifie pas l'état.
 */
export function selectState<S extends object, T>(source: StateSource<S>, project: (state: S) => T): Observable<T> {
	const injector = inject(Injector);
	return new Observable<T>((subscriber): TeardownLogic => {
		const ref = watchState(source, (state: S) => subscriber.next(project(state)), {
			injector,
		});
		return () => ref.destroy();
	}).pipe(distinctUntilChanged());
}
