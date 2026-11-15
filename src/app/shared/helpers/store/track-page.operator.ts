import { Signal } from '@angular/core';

import { WritableStateSource } from '@ngrx/signals';
import { catchError, EMPTY, finalize, Observable } from 'rxjs';

import { initialize } from '@shared/helpers/rx.helper';
import { StateHelper } from '@shared/helpers/state/state.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { patchBlock } from '@shared/helpers/store/patch-block.helper';
import { ErrorModel } from '@shared/models/model/error.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';

type PageBlock = PageRequestInformationModel<unknown, GenericModel>;

/**
 * Objectif: Donne un accès en lecture et en écriture à un bloc de page de l'état d'un signal store.
 * Périmètre: Permet à des opérateurs génériques de mettre à jour l'état de chargement et d'erreur d'une seule ressource paginée.
 * Limites: Ne possède aucun état ; ne fait que relayer vers le store dont il est issu.
 */
export interface PageSlice<B extends PageBlock> {
	read: () => B;
	write: (block: B) => void;
}

/**
 * Objectif: Donne à un bloc de page d'un store l'accès en lecture et en écriture dont les opérateurs de page ont besoin.
 * Périmètre: Lit le bloc d'une clé et le réécrit.
 * Limites: Ne fait qu'envelopper le store ; ne récupère rien.
 */
export function pageSlice<S extends object, K extends keyof S & string>(
	store: WritableStateSource<S> & { [P in K]: Signal<S[P]> },
	key: K,
): PageSlice<S[K] & PageBlock> {
	return {
		read: () => store[key]() as S[K] & PageBlock,
		write: (block) => patchBlock(store, key, (): object => block),
	};
}

/**
 * Objectif: Borne les drapeaux de chargement et l'échec d'une requête de page au bloc de page donné.
 * Périmètre: Marque le bloc en chargement pendant la requête, puis stocke toute erreur dans le bloc.
 * Limites: Avale l'erreur (se termine vide) pour que le rxMethod englobant reste vivant ; ne récupère rien.
 */
export const trackPage =
	<B extends PageBlock>(slice: PageSlice<B>) =>
	<T>(source: Observable<T>): Observable<T> =>
		source.pipe(
			initialize(() => setLoading(slice, true)),
			finalize(() => setLoading(slice, false)),
			catchError((error: ErrorModel) => handleFailure(slice, error)),
		);

/**
 * Objectif: Démarre ou arrête l'état de chargement d'un bloc de page.
 * Périmètre: Efface l'erreur précédente quand un chargement démarre.
 * Limites: Ne touche pas à la page elle-même.
 */
function setLoading<B extends PageBlock>(slice: PageSlice<B>, loading: boolean): void {
	const block = slice.read();
	const cleared = loading ? { ...block, error: undefined } : block;
	slice.write({ ...cleared, ...StateHelper.updatePageLoader(cleared, loading) });
}

/**
 * Objectif: Conserve l'échec de récupération d'une page dans son bloc.
 * Périmètre: Écrit l'erreur à côté de la page pour que l'UI l'affiche sous les éléments.
 * Limites: Termine toujours le flux sans valeur pour que la méthode appelante reste utilisable.
 */
function handleFailure<B extends PageBlock>(slice: PageSlice<B>, error: ErrorModel): Observable<never> {
	const block = slice.read();
	slice.write({ ...block, ...PageStateHelper.withError(block, error) });
	return EMPTY;
}
