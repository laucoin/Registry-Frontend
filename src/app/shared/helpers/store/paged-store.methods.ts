import { StateSignals, WritableStateSource } from '@ngrx/signals';
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, defer, EMPTY, finalize, Observable, pipe, switchMap, tap } from 'rxjs';

import { MovementHelper } from '@shared/helpers/movement.helper';
import { ErrorSink, ignoreError, initialize, notifyOnError } from '@shared/helpers/rx.helper';
import { StateHelper } from '@shared/helpers/state/state.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { patchBlock, patchWith } from '@shared/helpers/store/patch-block.helper';
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator';
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model';
import { ErrorModel } from '@shared/models/model/error.model';
import { GenericModel } from '@shared/models/model/generic.model';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model';
import { PairModel } from '@shared/models/model/pair.model';
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model';
import { SelectOptionModel } from '@shared/models/model/select-option.model';

export type StoreRef<S extends object> = WritableStateSource<S> & StateSignals<S>;

type ParamsOf<B> = B extends PageRequestInformationModel<infer P, GenericModel> ? P : never;

type PageOf<B> = B extends PageRequestInformationModel<object, infer M extends GenericModel> ? PageModel<M> : never;

export interface MovementContentsApi {
	findMovementsContents(
		projectId: string | undefined,
		movementIds: string[],
		isCurrent: boolean,
	): Observable<PairModel<MovementContentModel[]>[]>;
}

export interface MovementContentsRequest {
	projectId: string | undefined;
	movementIds: string[];
}

type MovementsBlock = PageRequestInformationModel<MovementPageParamsModel, MovementModel>;

type PageBlock = PageRequestInformationModel<unknown, GenericModel>;

const CONTENTS_SECTION = 'contents';

interface PageFetcherHooks<R, P> {
	before?: (request: R) => void;
	after?: (request: R, page: P) => void;
	merge?: (current: P | undefined, fetched: P, request: R) => P;
	silent?: boolean;
}

interface PageFetch<S extends object, K extends keyof S & string, R> {
	store: StoreRef<S>;
	key: K;
	source: (request: R, params: ParamsOf<S[K]>) => Observable<PageOf<S[K]>>;
	errors: ErrorSink;
	hooks: PageFetcherHooks<R, PageOf<S[K]>>;
}

/**
 * Objectif: Construit le rxMethod qui charge une ressource paginée d'un signal store.
 * Périmètre: Exécute la requête donnée avec les paramètres de recherche courants, borne le chargement et les erreurs au bloc, puis stocke la page (fusionnée avec celle affichée quand un hook de fusion est donné) et efface le drapeau de réinitialisation.
 * Limites: Ne connaît pas l'api ; l'appelant fournit la requête. Des hooks optionnels s'exécutent avant chaque requête et après le stockage de la page ; un hook qui lève une exception est signalé et n'arrête pas la méthode.
 * Le hook `silent` construit un rafraîchissement en arrière-plan : il ne positionne aucun drapeau de chargement et laisse la page affichée et son état intacts quand la requête échoue.
 */
export function pageFetcher<S extends object, K extends keyof S & string, R>(
	store: StoreRef<S>,
	key: K,
	source: (request: R, params: ParamsOf<S[K]>) => Observable<PageOf<S[K]>>,
	errors: ErrorSink,
	hooks: PageFetcherHooks<R, PageOf<S[K]>> = {},
): RxMethod<R> {
	const fetch: PageFetch<S, K, R> = { store, key, source, errors, hooks };

	return rxMethod<R>(pipe(switchMap((request) => fetchPage(fetch, request))));
}

/**
 * Objectif: Exécute une requête de page d'une ressource paginée.
 * Périmètre: Ordonne le hook before, le chargement de la page, le commit et le signalement d'erreur.
 * Limites: Le hook before s'exécute dans le flux interne, ses exceptions sont donc signalées et n'arrêtent jamais la méthode.
 */
function fetchPage<S extends object, K extends keyof S & string, R>(
	fetch: PageFetch<S, K, R>,
	request: R,
): Observable<PageOf<S[K]>> {
	return defer(() => {
		fetch.hooks.before?.(request);
		return loadPage(fetch, request);
	}).pipe(
		tap((page) => commitPage(fetch, request, page)),
		fetch.hooks.silent ? ignoreError() : notifyOnError(fetch.errors),
	);
}

/**
 * Objectif: Récupère la page d'une requête avec l'état de chargement et d'erreur du bloc.
 * Périmètre: Lit les paramètres de recherche au départ de la requête, après le hook before, et borne le chargement au bloc.
 * Limites: Ne stocke pas la page ; le commit le fait.
 */
function loadPage<S extends object, K extends keyof S & string, R>(
	fetch: PageFetch<S, K, R>,
	request: R,
): Observable<PageOf<S[K]>> {
	const slice: ReturnType<typeof pageSlice> = pageSlice(fetch.store as never, fetch.key as never);

	const page$ = defer(() => fetch.source(request, readBlock(fetch.store, fetch.key).params as ParamsOf<S[K]>));

	return fetch.hooks.silent ? page$ : page$.pipe(trackPage(slice as never));
}

/**
 * Objectif: Lit l'état courant d'un bloc paginé d'un store.
 * Périmètre: Renvoie le bloc sous la clé donnée.
 * Limites: Ne copie ni ne restreint le bloc.
 */
function readBlock<S extends object, K extends keyof S & string>(store: StoreRef<S>, key: K): PageBlock {
	return (store as unknown as Record<K, () => PageBlock>)[key]();
}

/**
 * Objectif: Stocke une page récupérée dans son bloc.
 * Périmètre: La fusionne avec la page affichée quand un hook de fusion est donné, la stocke, puis appelle le hook after avec la seule page récupérée.
 * Limites: Ne gère pas les erreurs ; l'appelant les signale.
 */
function commitPage<S extends object, K extends keyof S & string, R>(
	fetch: PageFetch<S, K, R>,
	request: R,
	fetched: PageOf<S[K]>,
): void {
	const current = readBlock(fetch.store, fetch.key).element as PageOf<S[K]> | undefined;
	const stored = fetch.hooks.merge?.(current, fetched, request) ?? fetched;
	storePage(fetch.store, fetch.key, stored);
	fetch.hooks.after?.(request, fetched);
}

/**
 * Objectif: Écrit une page dans son bloc et efface le drapeau de réinitialisation.
 * Périmètre: Conserve les autres champs du bloc.
 * Limites: Ne fusionne pas les pages.
 */
function storePage<S extends object, K extends keyof S & string>(store: StoreRef<S>, key: K, page: unknown): void {
	patchBlock(store, key, (block) => ({
		...block,
		params: { ...((block as PageBlock).params as object), resetSearch: false },
		element: page,
	}));
}

/**
 * Objectif: Construit la fonction qui remplace les paramètres de recherche d'une ressource paginée.
 * Périmètre: Conserve le reste du bloc et remplace ses paramètres.
 * Limites: Ne recharge pas la page ; les appelants décident.
 */
export function paramsUpdater<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
): (params: ParamsOf<S[K]>) => void {
	return (params) => patchBlock(store, key, (block) => ({ ...block, params }));
}

/**
 * Objectif: Construit la fonction qui fusionne des paramètres de recherche dans ceux d'une ressource paginée.
 * Périmètre: Conserve les paramètres non fournis, comme un filtre de statut fixe.
 * Limites: Ne recharge pas la page ; les appelants décident.
 */
export function paramsMerger<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
): (params: Partial<ParamsOf<S[K]>>) => void {
	return (params) =>
		patchBlock(store, key, (block) => ({
			...block,
			params: { ...((block as PageBlock).params as object), ...params },
		}));
}

/**
 * Objectif: Construit le rxMethod qui complète une page de mouvements avec leurs contenus.
 * Périmètre: Récupère les contenus des mouvements donnés et les fusionne dans la page de mouvements stockée sous la clé
 * donnée (`movements` par défaut).
 * Limites: Laisse la page intacte quand aucune n'est stockée ; un échec est conservé dans l'erreur de section donnée
 * (`contents` par défaut).
 */
export function movementContentsFetcher<S extends SectionErrorsState, K extends keyof S & string>(
	store: StoreRef<S>,
	movementApi: MovementContentsApi,
	block: { key: K; section: string } = { key: 'movements' as K, section: CONTENTS_SECTION },
): RxMethod<MovementContentsRequest> {
	return rxMethod<MovementContentsRequest>(
		pipe(switchMap((request) => loadContents(store, movementApi, block, request))),
	);
}

/**
 * Objectif: Récupère les contenus des mouvements d'une requête et les fusionne dans la page stockée.
 * Périmètre: Lit le filtre « en cours » de la page au départ de la requête et borne l'erreur à la section du bloc.
 * Limites: Ne notifie pas l'utilisateur ; la page affiche l'erreur de section.
 */
function loadContents<S extends SectionErrorsState, K extends keyof S & string>(
	store: StoreRef<S>,
	movementApi: MovementContentsApi,
	block: { key: K; section: string },
	request: MovementContentsRequest,
): Observable<PairModel<MovementContentModel[]>[]> {
	const isCurrent = (readBlock(store, block.key) as MovementsBlock).params.isCurrent;
	return movementApi.findMovementsContents(request.projectId, request.movementIds, isCurrent).pipe(
		tap((contents) => patchWith(store, (state) => mergeContents(state, block.key, contents))),
		trackSectionError(store, block.section),
	);
}

/**
 * Objectif: Fusionne les contenus de mouvements récupérés dans les mouvements de la page affichée.
 * Périmètre: Reconstruit la page stockée sous la clé avec les contenus récupérés de ses mouvements.
 * Limites: Renvoie l'état inchangé quand aucune page n'est stockée.
 */
function mergeContents<S extends object>(
	state: S,
	key: keyof S & string,
	contents: PairModel<MovementContentModel[]>[],
): object {
	const block = state[key] as MovementsBlock;
	if (!block.element) return state;
	const content = MovementHelper.rebuildPageWithContent(block.element.content, contents);
	return { [key]: { ...block, element: { ...block.element, content } } };
}

/**
 * Objectif: Construit le callback qui récupère les contenus d'une page de mouvements fraîchement chargée.
 * Périmètre: Demande les contenus des mouvements de la page qui vient d'arriver, sauf si elle est vide.
 * Limites: Ne fait que déclencher la récupération ; la méthode des contenus stocke le résultat.
 */
export function contentsRequester(
	fetchContents: (request: MovementContentsRequest) => void,
): (request: { projectId: string | undefined }, page: PageModel<MovementModel>) => void {
	return (request, page) => {
		if (page.content.length > 0) {
			fetchContents({
				projectId: request.projectId,
				movementIds: page.content.map((movement) => movement.id),
			});
		}
	};
}

type ElementOf<B> = B extends ElementRequestInformationModel<infer M> ? M : never;

type ElementBlock = ElementRequestInformationModel<unknown>;

export const contentsSection = (block: string): string => `${CONTENTS_SECTION}.${block}`;

const metadataSection = (field: string): string => `metadata.${field}`;

/**
 * Objectif: Construit un opérateur qui conserve l'échec d'une récupération secondaire dans les erreurs de section du store.
 * Périmètre: Efface l'erreur de section au départ de la requête, stocke l'échec et se termine sans rien émettre.
 * Limites: Ne notifie pas l'utilisateur ; la page affiche l'erreur de section.
 */
export function trackSectionError<S extends SectionErrorsState>(
	store: StoreRef<S>,
	section: string,
): <T>(source: Observable<T>) => Observable<T> {
	return <T>(source: Observable<T>): Observable<T> =>
		source.pipe(
			initialize(() => setSectionError(store, section, undefined)),
			catchError((error: ErrorModel) => keepSectionError(store, section, error)),
		);
}

function keepSectionError<S extends SectionErrorsState>(
	store: StoreRef<S>,
	section: string,
	error: ErrorModel,
): Observable<never> {
	setSectionError(store, section, PageStateHelper.toNotification(error));
	return EMPTY;
}

function setSectionError<S extends SectionErrorsState>(
	store: StoreRef<S>,
	section: string,
	error: NotificationModel | undefined,
): void {
	patchWith(store, (state) => ({ sectionErrors: { ...state.sectionErrors, [section]: error } }));
}

/**
 * Objectif: Construit un opérateur qui borne le drapeau de chargement d'un bloc d'élément à une requête.
 * Périmètre: Lève le drapeau au départ de la requête et l'abaisse à sa fin, quelle que soit l'issue.
 * Limites: Ne gère pas les erreurs ; à composer avec un opérateur d'erreur.
 */
export function trackElement<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
): <T>(source: Observable<T>) => Observable<T> {
	return <T>(source: Observable<T>): Observable<T> =>
		source.pipe(
			initialize(() => setElementLoading(store, key, true)),
			finalize(() => setElementLoading(store, key, false)),
		);
}

/**
 * Objectif: Lève ou abaisse le drapeau de chargement d'un bloc d'élément.
 * Périmètre: Conserve le reste du bloc.
 * Limites: Ne démarre ni n'annule aucune requête.
 */
function setElementLoading<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
	loading: boolean,
): void {
	patchBlock(store, key, (block) => StateHelper.updateElementLoader(block as ElementBlock as never, loading));
}

/**
 * Objectif: Construit la fonction qui positionne à la main le drapeau de chargement d'un bloc d'élément.
 * Périmètre: Permet à une facade de borner le loader d'un élément à sa propre commande.
 * Limites: Ne fait que basculer le drapeau ; ne récupère jamais rien.
 */
export function loaderToggle<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
	loading: boolean,
): () => void {
	return () => setElementLoading(store, key, loading);
}

function keepElementError<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
): <T>(source: Observable<T>) => Observable<T> {
	return <T>(source: Observable<T>): Observable<T> =>
		source.pipe(
			initialize(() => setElementError(store, key, undefined)),
			catchError((error: ErrorModel) => keepError(store, key, error)),
		);
}

function keepError<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
	error: ErrorModel,
): Observable<never> {
	setElementError(store, key, PageStateHelper.toNotification(error));
	return EMPTY;
}

function setElementError<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
	error: NotificationModel | undefined,
): void {
	patchBlock(store, key, (block) => ({ ...block, error }));
}

/**
 * Objectif: Construit le rxMethod qui charge un élément d'un signal store.
 * Périmètre: Borne le drapeau de chargement au bloc d'élément, conserve un échec dans l'erreur du bloc et stocke l'élément.
 * Limites: Un échec laisse l'élément précédent en place ; l'erreur est effacée au départ de la requête suivante.
 */
export function elementFetcher<S extends object, K extends keyof S & string, R>(
	store: StoreRef<S>,
	key: K,
	source: (request: R) => Observable<ElementOf<S[K]>>,
): RxMethod<R> {
	return rxMethod<R>(pipe(switchMap((request) => loadElement(store, key, source(request)))));
}

function loadElement<S extends object, K extends keyof S & string, E>(
	store: StoreRef<S>,
	key: K,
	element$: Observable<E>,
): Observable<E> {
	return element$.pipe(
		trackElement(store, key),
		tap((element) => storeElement(store, key, element)),
		keepElementError(store, key),
	);
}

function storeElement<S extends object, K extends keyof S & string>(
	store: StoreRef<S>,
	key: K,
	element: unknown,
): void {
	patchBlock(store, key, (block) => ({ ...block, element }));
}

/**
 * Objectif: Construit le rxMethod qui recharge un élément d'un signal store en arrière-plan.
 * Périmètre: Stocke l'élément quand la requête réussit, sans toucher au drapeau de chargement ni à l'erreur du bloc.
 * Limites: Un échec est ignoré et l'élément affiché reste en place ; le prochain rafraîchissement réessaie.
 */
export function silentElementFetcher<S extends object, K extends keyof S & string, R>(
	store: StoreRef<S>,
	key: K,
	source: (request: R) => Observable<ElementOf<S[K]>>,
): RxMethod<R> {
	return rxMethod<R>(pipe(switchMap((request) => refreshElement(store, key, source(request)))));
}

function refreshElement<S extends object, K extends keyof S & string, E>(
	store: StoreRef<S>,
	key: K,
	element$: Observable<E>,
): Observable<E> {
	return element$.pipe(
		tap((element) => storeElement(store, key, element)),
		ignoreError(),
	);
}

/**
 * Objectif: Construit le rxMethod qui remplit une liste de métadonnées d'un signal store.
 * Périmètre: Récupère les valeurs, les transforme éventuellement, et les stocke sous le champ de métadonnées.
 * Limites: Un échec est conservé dans l'erreur de section du champ et les valeurs précédentes restent.
 */
export function metadataFetcher<
	S extends SectionErrorsState & { metadata: object },
	F extends keyof S['metadata'] & string,
	R,
	T,
>(
	store: StoreRef<S>,
	field: F,
	source: (request: R) => Observable<T>,
	transform: (value: T) => S['metadata'][F] = (value) => value as unknown as S['metadata'][F],
): RxMethod<R> {
	return rxMethod<R>(pipe(switchMap((request) => loadMetadata(store, field, source(request), transform))));
}

function loadMetadata<S extends SectionErrorsState & { metadata: object }, F extends keyof S['metadata'] & string, T>(
	store: StoreRef<S>,
	field: F,
	value$: Observable<T>,
	transform: (value: T) => S['metadata'][F],
): Observable<T> {
	return value$.pipe(
		tap((value) => storeMetadata(store, field, transform(value))),
		trackSectionError(store, metadataSection(field)),
	);
}

function storeMetadata<S extends { metadata: object }, F extends keyof S['metadata'] & string>(
	store: StoreRef<S>,
	field: F,
	value: S['metadata'][F],
): void {
	patchBlock(store, 'metadata', (metadata) => ({ ...metadata, [field]: value }));
}

/**
 * Objectif: Ajoute en tête l'option vide « aucun filtre » à une liste de select items.
 * Périmètre: Permet aux listes déroulantes de filtre de proposer un choix neutre pour les métadonnées récupérées.
 * Limites: Fonction pure ; le libellé de l'option vide n'est pas traduit ici.
 */
export function withEmptyOption<T>(items: SelectOptionModel<T>[]): SelectOptionModel<T | undefined>[] {
	return [{ label: '-', value: undefined }, ...items];
}
