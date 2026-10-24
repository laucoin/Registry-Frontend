import { Signal } from '@angular/core'
import { patchState, WritableStateSource } from '@ngrx/signals'
import { catchError, EMPTY, finalize, Observable } from 'rxjs'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize } from '@shared/helpers/rx.helper'

type PageBlock = PageRequestInformationModel<unknown, GenericModel>

/**
 * Purpose: Donne un accès en lecture et en écriture à un bloc de page de l'état d'un signal store.
 * Scope: Permet à des opérateurs génériques de mettre à jour l'état de chargement et d'erreur d'une seule ressource paginée.
 * Limits: Ne possède aucun état ; ne fait que relayer vers le store dont il est issu.
 */
export interface PageSlice<B extends PageBlock> {
    read: () => B
    write: (block: B) => void
}

/**
 * Purpose: Donne à un bloc de page d'un store l'accès en lecture et en écriture dont les opérateurs de page ont besoin.
 * Scope: Lit le bloc d'une clé et le réécrit.
 * Limits: Ne fait qu'envelopper le store ; ne récupère rien.
 */
export function pageSlice<S extends object, K extends keyof S & string>(
    store: WritableStateSource<S> & { [P in K]: Signal<S[P]> },
    key: K,
): PageSlice<S[K] & PageBlock> {
    return {
        read: (): S[K] & PageBlock => store[key]() as S[K] & PageBlock,
        write: (block: S[K] & PageBlock): void => patchState( store, { [key]: block } as unknown as Partial<S> ),
    }
}

/**
 * Purpose: Borne les drapeaux de chargement et l'échec d'une requête de page au bloc de page donné.
 * Scope: Marque le bloc en chargement pendant la requête, puis stocke toute erreur dans le bloc.
 * Limits: Avale l'erreur (se termine vide) pour que le rxMethod englobant reste vivant ; ne récupère rien.
 */
export const trackPage = <B extends PageBlock>(slice: PageSlice<B>) =>
    <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => setLoading( slice, true ) ),
        finalize( (): void => setLoading( slice, false ) ),
        catchError( (error: ErrorModel): Observable<never> => handleFailure( slice, error ) ),
    )

/**
 * Purpose: Démarre ou arrête l'état de chargement d'un bloc de page.
 * Scope: Efface l'erreur précédente quand un chargement démarre.
 * Limits: Ne touche pas à la page elle-même.
 */
function setLoading<B extends PageBlock>(slice: PageSlice<B>, loading: boolean): void {
    const block: B = slice.read()
    const cleared: B = loading ? { ...block, error: undefined } : block
    slice.write( { ...cleared, ...StateHelper.updatePageLoader( cleared, loading ) } )
}

/**
 * Purpose: Conserve l'échec de récupération d'une page dans son bloc.
 * Scope: Écrit l'erreur à côté de la page pour que l'UI l'affiche sous les éléments.
 * Limits: Termine toujours le flux sans valeur pour que la méthode appelante reste utilisable.
 */
function handleFailure<B extends PageBlock>(slice: PageSlice<B>, error: ErrorModel): Observable<never> {
    const block: B = slice.read()
    slice.write( { ...block, ...PageStateHelper.withError( block, error ) } )
    return EMPTY
}
