import { inject, InjectionToken } from '@angular/core'
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals'
import { Observable } from 'rxjs'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { SectionErrorsState } from '@shared/models/model/section-errors-state.model'
import { ErrorSink } from '@shared/helpers/rx.helper'
import { contentsRequester, MovementContentsApi, elementFetcher, loaderToggle, metadataFetcher, movementContentsFetcher, pageFetcher, paramsMerger, paramsUpdater } from '@shared/helpers/store/paged-store.methods'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { GenericModel } from '@shared/models/model/generic.model'
import { MovementModel } from '@shared/models/model/movement.model'
import { PageModel } from '@shared/models/model/page.model'
import { ElementRequestInformationModel } from '@shared/models/model/element-request-information.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'

export interface TestItemsParams {
    resetSearch: boolean
    text: string | undefined
}

export interface TestPagedState extends SectionErrorsState {
    items: PageRequestInformationModel<TestItemsParams, GenericModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    item: ElementRequestInformationModel<GenericModel>
    metadata: { labels: string[] }
}

export type ItemsSource = (request: { n: number }, params: TestItemsParams) => Observable<PageModel<GenericModel>>
export type MovementsSource = (request: { projectId: string | undefined }, params: MovementPageParamsModel) => Observable<PageModel<MovementModel>>

function appendMovements (current: PageModel<MovementModel> | undefined, fetched: PageModel<MovementModel>): PageModel<MovementModel> {
    return current ? { ...fetched, content: [ ...current.content, ...fetched.content ] } : fetched
}

export type ItemSource = (id: string) => Observable<GenericModel>
export type LabelsSource = (prefix: string) => Observable<string[]>

/**
 * Purpose: Injection tokens that give the test store its sources, errors and api.
 * Scope: One token per source the paged store builders call.
 * Limits: Test fixtures only.
 */
export const ITEM_SOURCE: InjectionToken<ItemSource> = new InjectionToken<ItemSource>( 'item source' )
export const LABELS_SOURCE: InjectionToken<LabelsSource> = new InjectionToken<LabelsSource>( 'labels source' )
export const ITEMS_SOURCE: InjectionToken<ItemsSource> = new InjectionToken<ItemsSource>( 'items source' )
export const MOVEMENTS_SOURCE: InjectionToken<MovementsSource> = new InjectionToken<MovementsSource>( 'movements source' )
export const MOVEMENT_CONTENTS_API: InjectionToken<MovementContentsApi> = new InjectionToken<MovementContentsApi>( 'movement contents api' )
export const TEST_ERRORS: InjectionToken<ErrorSink> = new InjectionToken<ErrorSink>( 'errors' )

/**
 * Purpose: Signal store used to test the paged store builders.
 * Scope: Exposes one method per builder, wired to injectable sources.
 * Limits: Test double only; it holds no business rule.
 */
export const TestPagedStore = signalStore(
    withState<TestPagedState>( {
        sectionErrors: {},
        items: PageStateHelper.initial<TestItemsParams, GenericModel>( { resetSearch: true, text: undefined } ),
        movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
            resetSearch: false,
            isCurrent: true,
            hasActivity: undefined,
            isVisible: undefined,
            type: undefined,
            from: undefined,
            to: undefined,
        } ),
        item: { element: undefined, loading: false, error: undefined },
        metadata: { labels: [] },
    } ),
    withMethods( (store, movementApi = inject( MOVEMENT_CONTENTS_API ), errors = inject( TEST_ERRORS )) => ({
        fetchItems: pageFetcher( store, 'items', inject( ITEMS_SOURCE ), errors ),
        fetchAppendedItems: pageFetcher( store, 'items', inject( ITEMS_SOURCE ), errors, {
            merge: (current, fetched, request) => CumulativePageHelper.merge( current, fetched, { page: request.n, size: undefined } ),
        } ),
        fetchGuardedItems: pageFetcher( store, 'items', inject( ITEMS_SOURCE ), errors, {
            before: (request): void => { if (request.n < 0) throw new Error( 'hook failed' ) },
        } ),
        fetchResettingItems: pageFetcher( store, 'items', inject( ITEMS_SOURCE ), errors, {
            before: (): void => patchState( store, (state) => ({ items: { ...state.items, params: { ...state.items.params, text: 'reset' } } }) ),
        } ),
        updateItemsParams: paramsUpdater( store, 'items' ),
        mergeItemsParams: paramsMerger( store, 'items' ),
        fetchContents: movementContentsFetcher( store, movementApi ),
        fetchItem: elementFetcher( store, 'item', inject( ITEM_SOURCE )),
        fetchLabels: metadataFetcher( store, 'labels', inject( LABELS_SOURCE ), (labels: string[]): string[] => [ '-', ...labels ] ),
        startItemLoader: loaderToggle( store, 'item', true ),
        stopItemLoader: loaderToggle( store, 'item', false ),
    }) ),
    withMethods( (store, errors = inject( TEST_ERRORS )) => ({
        fetchMovements: pageFetcher( store, 'movements', inject( MOVEMENTS_SOURCE ), errors, { after: contentsRequester( store.fetchContents ), merge: appendMovements } ),
    }) ),
)
