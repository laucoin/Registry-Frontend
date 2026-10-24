import { patchState, StateSignals, WritableStateSource } from '@ngrx/signals'
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, defer, EMPTY, finalize, Observable, pipe, switchMap, tap } from 'rxjs'
import { SelectOptionModel } from '@shared/models/model/select-option.model'
import { ErrorSink, ignoreError, initialize, notifyOnError } from '@shared/helpers/rx.helper'
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { ErrorModel } from '@shared/models/model/error.model'
import { MovementHelper } from '@shared/helpers/movement.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { pageSlice, trackPage } from '@shared/helpers/store/track-page.operator'
import { GenericModel } from '@shared/models/model/generic.model'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementContentModel } from '@shared/models/model/movement-content.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { PageModel } from '@shared/models/model/page.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { PairModel } from '@shared/models/model/pair.model'
import { NotificationModel } from '@shared/models/model/notification.model'

export type StoreRef<S extends object> = WritableStateSource<S> & StateSignals<S>

type ParamsOf<B> = B extends PageRequestInformationModel<infer P, GenericModel> ? P : never

type PageOf<B> = B extends PageRequestInformationModel<object, infer M extends GenericModel> ? PageModel<M> : never

export interface MovementContentsApi {
    findMovementsContents (projectId: string | undefined, movementIds: string[], isCurrent: boolean): Observable<PairModel<MovementContentModel[]>[]>
}

export interface MovementContentsRequest {
    projectId: string | undefined
    movementIds: string[]
}

type MovementsBlock = PageRequestInformationModel<MovementPageParamsModel, MovementModel>

type PageBlock = PageRequestInformationModel<unknown, GenericModel>

interface PageFetcherHooks<R, P> {
    before?: (request: R) => void
    after?: (request: R, page: P) => void
    merge?: (current: P | undefined, fetched: P, request: R) => P
    silent?: boolean
}

interface PageFetch<S extends object, K extends keyof S & string, R> {
    store: StoreRef<S>
    key: K
    source: (request: R, params: ParamsOf<S[K]>) => Observable<PageOf<S[K]>>
    errors: ErrorSink
    hooks: PageFetcherHooks<R, PageOf<S[K]>>
}

/**
 * Purpose: Construit le rxMethod qui charge une ressource paginée d'un signal store.
 * Scope: Exécute la requête donnée avec les paramètres de recherche courants, borne le chargement et les erreurs au bloc, puis stocke la page (fusionnée avec celle affichée quand un hook de fusion est donné) et efface le drapeau de réinitialisation.
 * Limits: Ne connaît pas l'api ; l'appelant fournit la requête. Des hooks optionnels s'exécutent avant chaque requête et après le stockage de la page ; un hook qui lève une exception est signalé et n'arrête pas la méthode.
 * Le hook `silent` construit un rafraîchissement en arrière-plan : il ne positionne aucun drapeau de chargement et laisse la page affichée et son état intacts quand la requête échoue.
 */
export function pageFetcher<S extends object, K extends keyof S & string, R> (
    store: StoreRef<S>,
    key: K,
    source: (request: R, params: ParamsOf<S[K]>) => Observable<PageOf<S[K]>>,
    errors: ErrorSink,
    hooks: PageFetcherHooks<R, PageOf<S[K]>> = {},
): RxMethod<R> {
    const fetch: PageFetch<S, K, R> = { store, key, source, errors, hooks }

    return rxMethod<R>( pipe(
        switchMap( (request: R): Observable<PageOf<S[K]>> => fetchPage( fetch, request ) ),
    ) )
}

/**
 * Purpose: Exécute une requête de page d'une ressource paginée.
 * Scope: Ordonne le hook before, le chargement de la page, le commit et le signalement d'erreur.
 * Limits: Le hook before s'exécute dans le flux interne, ses exceptions sont donc signalées et n'arrêtent jamais la méthode.
 */
function fetchPage<S extends object, K extends keyof S & string, R> (fetch: PageFetch<S, K, R>, request: R): Observable<PageOf<S[K]>> {
    return defer( (): Observable<PageOf<S[K]>> => {
        fetch.hooks.before?.( request )
        return loadPage( fetch, request )
    } ).pipe(
        tap( (page: PageOf<S[K]>): void => commitPage( fetch, request, page ) ),
        fetch.hooks.silent ? ignoreError() : notifyOnError( fetch.errors ),
    )
}

/**
 * Purpose: Récupère la page d'une requête avec l'état de chargement et d'erreur du bloc.
 * Scope: Lit les paramètres de recherche au départ de la requête, après le hook before, et borne le chargement au bloc.
 * Limits: Ne stocke pas la page ; le commit le fait.
 */
function loadPage<S extends object, K extends keyof S & string, R> (fetch: PageFetch<S, K, R>, request: R): Observable<PageOf<S[K]>> {
    const slice: ReturnType<typeof pageSlice> = pageSlice( fetch.store as never, fetch.key as never )

    const page$: Observable<PageOf<S[K]>> = defer(
        (): Observable<PageOf<S[K]>> => fetch.source( request, readBlock( fetch.store, fetch.key ).params as ParamsOf<S[K]> ),
    )

    return fetch.hooks.silent ? page$ : page$.pipe( trackPage( slice as never ) )
}

/**
 * Purpose: Lit l'état courant d'un bloc paginé d'un store.
 * Scope: Renvoie le bloc sous la clé donnée.
 * Limits: Ne copie ni ne restreint le bloc.
 */
function readBlock<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): PageBlock {
    return (store as unknown as Record<K, () => PageBlock>)[ key ]()
}

/**
 * Purpose: Stocke une page récupérée dans son bloc.
 * Scope: La fusionne avec la page affichée quand un hook de fusion est donné, la stocke, puis appelle le hook after avec la seule page récupérée.
 * Limits: Ne gère pas les erreurs ; l'appelant les signale.
 */
function commitPage<S extends object, K extends keyof S & string, R> (fetch: PageFetch<S, K, R>, request: R, fetched: PageOf<S[K]>): void {
    const current: PageOf<S[K]> | undefined = readBlock( fetch.store, fetch.key ).element as PageOf<S[K]> | undefined
    const stored: PageOf<S[K]> = fetch.hooks.merge?.( current, fetched, request ) ?? fetched
    storePage( fetch.store, fetch.key, stored )
    fetch.hooks.after?.( request, fetched )
}

/**
 * Purpose: Écrit une page dans son bloc et efface le drapeau de réinitialisation.
 * Scope: Conserve les autres champs du bloc.
 * Limits: Ne fusionne pas les pages.
 */
function storePage<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K, page: unknown): void {
    patchState( store, (state: S) => ({
        [ key ]: {
            ...state[ key ],
            params: { ...(state[ key ] as PageBlock).params as object, resetSearch: false },
            element: page,
        },
    }) as unknown as Partial<S> )
}

/**
 * Purpose: Construit la fonction qui remplace les paramètres de recherche d'une ressource paginée.
 * Scope: Conserve le reste du bloc et remplace ses paramètres.
 * Limits: Ne recharge pas la page ; les appelants décident.
 */
export function paramsUpdater<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): (params: ParamsOf<S[K]>) => void {
    return (params: ParamsOf<S[K]>): void => {
        patchState( store, (state: S) => ({ [ key ]: { ...state[ key ], params } }) as unknown as Partial<S> )
    }
}

/**
 * Purpose: Construit la fonction qui fusionne des paramètres de recherche dans ceux d'une ressource paginée.
 * Scope: Conserve les paramètres non fournis, comme un filtre de statut fixe.
 * Limits: Ne recharge pas la page ; les appelants décident.
 */
export function paramsMerger<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): (params: Partial<ParamsOf<S[K]>>) => void {
    return (params: Partial<ParamsOf<S[K]>>): void => {
        patchState( store, (state: S) => ({
            [ key ]: { ...state[ key ], params: { ...(state[ key ] as PageBlock).params as object, ...params } },
        }) as unknown as Partial<S> )
    }
}

/**
 * Purpose: Construit le rxMethod qui complète une page de mouvements avec leurs contenus.
 * Scope: Récupère les contenus des mouvements donnés et les fusionne dans la page de mouvements stockée.
 * Limits: Laisse la page intacte quand aucune n'est stockée ; un échec est conservé dans l'erreur de section `contents`.
 */
export function movementContentsFetcher<S extends SectionErrorsState & { movements: MovementsBlock }> (
    store: StoreRef<S>,
    movementApi: MovementContentsApi,
): RxMethod<MovementContentsRequest> {
    const movements: () => MovementsBlock = (): MovementsBlock => (store as unknown as { movements: () => MovementsBlock }).movements()

    return rxMethod<MovementContentsRequest>( pipe(
        switchMap( (request: MovementContentsRequest): Observable<PairModel<MovementContentModel[]>[]> => movementApi.findMovementsContents(
            request.projectId,
            request.movementIds,
            movements().params.isCurrent,
        ).pipe( trackSectionError( store, CONTENTS_SECTION ) ) ),
        tap( (contents: PairModel<MovementContentModel[]>[]): void => patchState( store, (state: S) => mergeContents( state, contents ) ) ),
    ) )
}

/**
 * Purpose: Fusionne les contenus de mouvements récupérés dans les mouvements de la page affichée.
 * Scope: Reconstruit la page stockée avec les contenus récupérés de ses mouvements.
 * Limits: Renvoie l'état inchangé quand aucune page n'est stockée.
 */
function mergeContents<S extends { movements: MovementsBlock }> (state: S, contents: PairModel<MovementContentModel[]>[]): Partial<S> | S {
    if (!state.movements.element) return state
    const content: MovementModel[] = MovementHelper.rebuildPageWithContent( state.movements.element.content, contents )
    return { movements: { ...state.movements, element: { ...state.movements.element, content } } } as unknown as Partial<S>
}

/**
 * Purpose: Construit le callback qui récupère les contenus d'une page de mouvements fraîchement chargée.
 * Scope: Demande les contenus des mouvements de la page qui vient d'arriver, sauf si elle est vide.
 * Limits: Ne fait que déclencher la récupération ; la méthode des contenus stocke le résultat.
 */
export function contentsRequester (fetchContents: (request: MovementContentsRequest) => void): (request: { projectId: string | undefined }, page: PageModel<MovementModel>) => void {
    return (request: { projectId: string | undefined }, page: PageModel<MovementModel>): void => {
        if (page.content.length > 0) {
            fetchContents( { projectId: request.projectId, movementIds: page.content.map( (movement: MovementModel): string => movement.id ) } )
        }
    }
}

type ElementOf<B> = B extends ElementRequestInformationModel<infer M> ? M : never

type ElementBlock = ElementRequestInformationModel<unknown>

const CONTENTS_SECTION: string = 'contents'

export const contentsSection = (block: string): string => `${CONTENTS_SECTION}.${block}`

const metadataSection = (field: string): string => `metadata.${field}`

/**
 * Purpose: Construit un opérateur qui conserve l'échec d'une récupération secondaire dans les erreurs de section du store.
 * Scope: Efface l'erreur de section au départ de la requête, stocke l'échec et se termine sans rien émettre.
 * Limits: Ne notifie pas l'utilisateur ; la page affiche l'erreur de section.
 */
export function trackSectionError<S extends SectionErrorsState> (store: StoreRef<S>, section: string): <T> (source: Observable<T>) => Observable<T> {
    return <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => setSectionError( store, section, undefined ) ),
        catchError( (error: ErrorModel): Observable<never> => {
            setSectionError( store, section, PageStateHelper.toNotification( error ) )
            return EMPTY
        } ),
    )
}

function setSectionError<S extends SectionErrorsState> (store: StoreRef<S>, section: string, error: NotificationModel | undefined): void {
    patchState( store, (state: S) => ({ sectionErrors: { ...state.sectionErrors, [ section ]: error } }) as unknown as Partial<S> )
}

/**
 * Purpose: Construit un opérateur qui borne le drapeau de chargement d'un bloc d'élément à une requête.
 * Scope: Lève le drapeau au départ de la requête et l'abaisse à sa fin, quelle que soit l'issue.
 * Limits: Ne gère pas les erreurs ; à composer avec un opérateur d'erreur.
 */
export function trackElement<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): <T> (source: Observable<T>) => Observable<T> {
    return <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => setElementLoading( store, key, true ) ),
        finalize( (): void => setElementLoading( store, key, false ) ),
    )
}

/**
 * Purpose: Lève ou abaisse le drapeau de chargement d'un bloc d'élément.
 * Scope: Conserve le reste du bloc.
 * Limits: Ne démarre ni n'annule aucune requête.
 */
function setElementLoading<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K, loading: boolean): void {
    patchState( store, (state: S) => ({ [ key ]: StateHelper.updateElementLoader( state[ key ] as ElementBlock as never, loading ) }) as unknown as Partial<S> )
}

/**
 * Purpose: Construit la fonction qui positionne à la main le drapeau de chargement d'un bloc d'élément.
 * Scope: Permet à une facade de borner le loader d'un élément à sa propre commande.
 * Limits: Ne fait que basculer le drapeau ; ne récupère jamais rien.
 */
export function loaderToggle<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K, loading: boolean): () => void {
    return (): void => setElementLoading( store, key, loading )
}

function keepElementError<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): <T> (source: Observable<T>) => Observable<T> {
    return <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => setElementError( store, key, undefined ) ),
        catchError( (error: ErrorModel): Observable<never> => {
            setElementError( store, key, PageStateHelper.toNotification( error ) )
            return EMPTY
        } ),
    )
}

function setElementError<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K, error: NotificationModel | undefined): void {
    patchState( store, (state: S) => ({ [ key ]: { ...state[ key ], error } }) as unknown as Partial<S> )
}

/**
 * Purpose: Construit le rxMethod qui charge un élément d'un signal store.
 * Scope: Borne le drapeau de chargement au bloc d'élément, conserve un échec dans l'erreur du bloc et stocke l'élément.
 * Limits: Un échec laisse l'élément précédent en place ; l'erreur est effacée au départ de la requête suivante.
 */
export function elementFetcher<S extends object, K extends keyof S & string, R> (
    store: StoreRef<S>,
    key: K,
    source: (request: R) => Observable<ElementOf<S[K]>>,
): RxMethod<R> {
    return rxMethod<R>( pipe(
        switchMap( (request: R): Observable<ElementOf<S[K]>> => source( request ).pipe( trackElement( store, key ), keepElementError( store, key ) ) ),
        tap( (element: ElementOf<S[K]>): void => patchState( store, (state: S) => ({ [ key ]: { ...state[ key ], element } }) as unknown as Partial<S> ) ),
    ) )
}

/**
 * Purpose: Construit le rxMethod qui recharge un élément d'un signal store en arrière-plan.
 * Scope: Stocke l'élément quand la requête réussit, sans toucher au drapeau de chargement ni à l'erreur du bloc.
 * Limits: Un échec est ignoré et l'élément affiché reste en place ; le prochain rafraîchissement réessaie.
 */
export function silentElementFetcher<S extends object, K extends keyof S & string, R> (
    store: StoreRef<S>,
    key: K,
    source: (request: R) => Observable<ElementOf<S[K]>>,
): RxMethod<R> {
    return rxMethod<R>( pipe(
        switchMap( (request: R): Observable<ElementOf<S[K]>> => source( request ).pipe( ignoreError() ) ),
        tap( (element: ElementOf<S[K]>): void => patchState( store, (state: S) => ({ [ key ]: { ...state[ key ], element } }) as unknown as Partial<S> ) ),
    ) )
}

/**
 * Purpose: Construit le rxMethod qui remplit une liste de métadonnées d'un signal store.
 * Scope: Récupère les valeurs, les transforme éventuellement, et les stocke sous le champ de métadonnées.
 * Limits: Un échec est conservé dans l'erreur de section du champ et les valeurs précédentes restent.
 */
export function metadataFetcher<S extends SectionErrorsState & { metadata: object }, F extends keyof S[ 'metadata' ] & string, R, T> (
    store: StoreRef<S>,
    field: F,
    source: (request: R) => Observable<T>,
    transform: (value: T) => S[ 'metadata' ][ F ] = (value: T): S[ 'metadata' ][ F ] => value as unknown as S[ 'metadata' ][ F ],
): RxMethod<R> {
    return rxMethod<R>( pipe(
        switchMap( (request: R): Observable<T> => source( request ).pipe( trackSectionError( store, metadataSection( field ) ) ) ),
        tap( (value: T): void => patchState( store, (state: S) => ({ metadata: { ...state.metadata, [ field ]: transform( value ) } }) as unknown as Partial<S> ) ),
    ) )
}

/**
 * Purpose: Ajoute en tête l'option vide « aucun filtre » à une liste de select items.
 * Scope: Permet aux listes déroulantes de filtre de proposer un choix neutre pour les métadonnées récupérées.
 * Limits: Fonction pure ; le libellé de l'option vide n'est pas traduit ici.
 */
export function withEmptyOption<T> (items: SelectOptionModel<T>[]): SelectOptionModel<T | undefined>[] {
    return [ { label: '-', value: undefined }, ...items ]
}
