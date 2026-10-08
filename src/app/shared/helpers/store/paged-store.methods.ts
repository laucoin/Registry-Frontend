import { patchState, StateSignals, WritableStateSource } from '@ngrx/signals'
import { RxMethod, rxMethod } from '@ngrx/signals/rxjs-interop'
import { finalize, map, Observable, pipe, switchMap, tap } from 'rxjs'
import { SelectItem } from 'primeng/api'
import { ErrorSink, initialize, notifyOnError } from '@shared/helpers/rx.helper'
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

export type StoreRef<S extends object> = WritableStateSource<S> & StateSignals<S>

export type ParamsOf<B> = B extends PageRequestInformationModel<infer P, GenericModel> ? P : never

export type PageOf<B> = B extends PageRequestInformationModel<object, infer M extends GenericModel> ? PageModel<M> : never

export interface MovementContentsApi {
    findMovementsContents (projectId: string | undefined, movementIds: string[], currentMovements: boolean): Observable<PairModel<MovementContentModel[]>[]>
}

export interface MovementContentsRequest {
    projectId: string | undefined
    movementIds: string[]
}

type MovementsBlock = PageRequestInformationModel<MovementPageParamsModel, MovementModel>

type PageBlock = PageRequestInformationModel<unknown, GenericModel>

export interface PageFetcherHooks<R, P> {
    before?: (request: R) => void
    after?: (request: R, page: P) => void
}

/**
 * Purpose: Builds the rxMethod that loads one paged resource of a signal store.
 * Scope: Runs the given request with the current search parameters, scopes loading and errors to the block, then stores the page and clears the reset flag.
 * Limits: Does not know the api; the caller gives the request. Optional hooks run before each request and after the page is stored.
 */
export function pageFetcher<S extends object, K extends keyof S & string, R> (
    store: StoreRef<S>,
    key: K,
    source: (request: R, params: ParamsOf<S[K]>) => Observable<PageOf<S[K]>>,
    errors: ErrorSink,
    hooks: PageFetcherHooks<R, PageOf<S[K]>> = {},
): RxMethod<R> {
    const block: () => S[K] & PageBlock = (): S[K] & PageBlock => (store as unknown as Record<K, () => S[K] & PageBlock>)[ key ]()
    const slice: ReturnType<typeof pageSlice> = pageSlice( store as never, key as never )

    return rxMethod<R>( pipe(
        tap( (request: R): void => hooks.before?.( request ) ),
        switchMap( (request: R): Observable<{ request: R, page: PageOf<S[K]> }> => source( request, block().params as ParamsOf<S[K]> ).pipe(
            trackPage( errors, slice as never ),
            map( (page: PageOf<S[K]>) => ({ request, page }) ),
        ) ),
        tap( ({ request, page }: { request: R, page: PageOf<S[K]> }): void => {
            storePage( store, key, page )
            hooks.after?.( request, page )
        } ),
    ) )
}

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
 * Purpose: Builds the function that replaces the search parameters of one paged resource.
 * Scope: Keeps the rest of the block and swaps its params.
 * Limits: Does not reload the page; callers decide.
 */
export function paramsUpdater<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): (params: ParamsOf<S[K]>) => void {
    return (params: ParamsOf<S[K]>): void => {
        patchState( store, (state: S) => ({ [ key ]: { ...state[ key ], params } }) as unknown as Partial<S> )
    }
}

/**
 * Purpose: Builds the function that merges search parameters into those of one paged resource.
 * Scope: Keeps the parameters that are not given, such as a fixed status filter.
 * Limits: Does not reload the page; callers decide.
 */
export function paramsMerger<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): (params: Partial<ParamsOf<S[K]>>) => void {
    return (params: Partial<ParamsOf<S[K]>>): void => {
        patchState( store, (state: S) => ({
            [ key ]: { ...state[ key ], params: { ...(state[ key ] as PageBlock).params as object, ...params } },
        }) as unknown as Partial<S> )
    }
}

/**
 * Purpose: Builds the rxMethod that completes a page of movements with their contents.
 * Scope: Fetches the contents of the given movements and merges them into the stored movements page.
 * Limits: Leaves the page untouched when none is stored or when the fetch fails (the failure is notified).
 */
export function movementContentsFetcher<S extends { movements: MovementsBlock }> (
    store: StoreRef<S>,
    movementApi: MovementContentsApi,
    errors: ErrorSink,
): RxMethod<MovementContentsRequest> {
    const movements: () => MovementsBlock = (): MovementsBlock => (store as unknown as { movements: () => MovementsBlock }).movements()

    return rxMethod<MovementContentsRequest>( pipe(
        switchMap( (request: MovementContentsRequest): Observable<PairModel<MovementContentModel[]>[]> => movementApi.findMovementsContents(
            request.projectId,
            request.movementIds,
            movements().params.currentMovements,
        ).pipe( notifyOnError( errors ) ) ),
        tap( (contents: PairModel<MovementContentModel[]>[]): void => patchState( store, (state: S) => mergeContents( state, contents ) ) ),
    ) )
}

function mergeContents<S extends { movements: MovementsBlock }> (state: S, contents: PairModel<MovementContentModel[]>[]): Partial<S> | S {
    if (!state.movements.element) return state
    const content: MovementModel[] = MovementHelper.rebuildPageWithContent( state.movements.element.content, contents )
    return { movements: { ...state.movements, element: { ...state.movements.element, content } } } as unknown as Partial<S>
}

/**
 * Purpose: Builds the callback that fetches the contents of a freshly loaded page of movements.
 * Scope: Asks for the contents of every movement of the page, unless the page is empty.
 * Limits: Only triggers the fetch; the contents method stores the result.
 */
export function contentsRequester (fetchContents: (request: MovementContentsRequest) => void): (request: { projectId: string | undefined }, page: PageModel<MovementModel>) => void {
    return (request: { projectId: string | undefined }, page: PageModel<MovementModel>): void => {
        if (page.content.length > 0) {
            fetchContents( { projectId: request.projectId, movementIds: page.content.map( (movement: MovementModel): string => movement.id ) } )
        }
    }
}

export type ElementOf<B> = B extends ElementRequestInformationModel<infer M> ? M : never

type ElementBlock = ElementRequestInformationModel<unknown>

/**
 * Purpose: Builds an operator that scopes the loading flag of one element block to a request.
 * Scope: Raises the flag when the request starts and lowers it when it ends, whatever the outcome.
 * Limits: Does not handle errors; compose it with an error operator.
 */
export function trackElement<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K): <T> (source: Observable<T>) => Observable<T> {
    return <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => setElementLoading( store, key, true ) ),
        finalize( (): void => setElementLoading( store, key, false ) ),
    )
}

function setElementLoading<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K, loading: boolean): void {
    patchState( store, (state: S) => ({ [ key ]: StateHelper.updateElementLoader( state[ key ] as ElementBlock as never, loading ) }) as unknown as Partial<S> )
}

/**
 * Purpose: Builds the function that sets the loading flag of one element block by hand.
 * Scope: Lets a facade scope the loader of an element to its own command.
 * Limits: Only toggles the flag; it never fetches.
 */
export function loaderToggle<S extends object, K extends keyof S & string> (store: StoreRef<S>, key: K, loading: boolean): () => void {
    return (): void => setElementLoading( store, key, loading )
}

/**
 * Purpose: Builds the rxMethod that loads one element of a signal store.
 * Scope: Scopes the loading flag to the element block, notifies a failure and stores the element.
 * Limits: A failure leaves the previous element in place.
 */
export function elementFetcher<S extends object, K extends keyof S & string, R> (
    store: StoreRef<S>,
    key: K,
    source: (request: R) => Observable<ElementOf<S[K]>>,
    errors: ErrorSink,
): RxMethod<R> {
    return rxMethod<R>( pipe(
        switchMap( (request: R): Observable<ElementOf<S[K]>> => source( request ).pipe( trackElement( store, key ), notifyOnError( errors ) ) ),
        tap( (element: ElementOf<S[K]>): void => patchState( store, (state: S) => ({ [ key ]: { ...state[ key ], element } }) as unknown as Partial<S> ) ),
    ) )
}

/**
 * Purpose: Builds the rxMethod that fills one metadata list of a signal store.
 * Scope: Fetches the values, optionally transforms them, and stores them under the metadata field.
 * Limits: A failure is notified and the previous values stay.
 */
export function metadataFetcher<S extends { metadata: object }, F extends keyof S[ 'metadata' ] & string, R, T> (
    store: StoreRef<S>,
    field: F,
    source: (request: R) => Observable<T>,
    errors: ErrorSink,
    transform: (value: T) => S[ 'metadata' ][ F ] = (value: T): S[ 'metadata' ][ F ] => value as unknown as S[ 'metadata' ][ F ],
): RxMethod<R> {
    return rxMethod<R>( pipe(
        switchMap( (request: R): Observable<T> => source( request ).pipe( notifyOnError( errors ) ) ),
        tap( (value: T): void => patchState( store, (state: S) => ({ metadata: { ...state.metadata, [ field ]: transform( value ) } }) as unknown as Partial<S> ) ),
    ) )
}

/**
 * Purpose: Prepends the empty "no filter" option to a list of select items.
 * Scope: Lets filter dropdowns offer a neutral choice for fetched metadata.
 * Limits: Pure function; the empty option label is not translated here.
 */
export function withEmptyOption<T> (items: SelectItem<T>[]): SelectItem<T | undefined>[] {
    return [ { label: '-', value: undefined }, ...items ]
}
