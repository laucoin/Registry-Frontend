import { patchState, WritableStateSource } from '@ngrx/signals'

/**
 * Purpose: Applique à un signal store une modification calculée à partir de son état, sans exiger un type partiel exact.
 * Scope: Enveloppe `patchState` pour les builders génériques, dont les clés d'état ne sont connues qu'à l'exécution.
 * Limits: Ne vérifie pas que la modification correspond à l'état du store ; l'appelant en répond.
 */
export function patchWith<S extends object> (store: WritableStateSource<S>, change: (state: S) => object): void {
    patchState( store, (state: S) => change( state ) as Partial<S> )
}

/**
 * Purpose: Remplace un seul bloc de l'état d'un signal store à partir de sa valeur courante.
 * Scope: Lit le bloc de la clé donnée, applique la modification et réécrit uniquement ce bloc.
 * Limits: Ne touche à aucun autre bloc ; la modification renvoie le nouveau bloc complet.
 */
export function patchBlock<S extends object, K extends keyof S & string> (store: WritableStateSource<S>, key: K, change: (block: S[ K ]) => object): void {
    patchWith( store, (state: S) => ({ [ key ]: change( state[ key ] ) }) )
}
