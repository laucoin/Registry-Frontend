import { inject, InjectionToken } from '@angular/core'
import { signalStore, withMethods, withState } from '@ngrx/signals'
import { Observable } from 'rxjs'
import { MovementPageParamsModel } from '@shared/models/model/movement-page-params.model'
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api'
import { ErrorSink } from '@shared/helpers/rx.helper'
import { contentsRequester, elementFetcher, loaderToggle, metadataFetcher, movementContentsFetcher, pageFetcher, paramsUpdater } from '@shared/helpers/store/paged-store.methods'
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

export interface TestPagedState {
    items: PageRequestInformationModel<TestItemsParams, GenericModel>
    movements: PageRequestInformationModel<MovementPageParamsModel, MovementModel>
    item: ElementRequestInformationModel<GenericModel>
    metadata: { labels: string[] }
}

export type ItemsSource = (request: { n: number }, params: TestItemsParams) => Observable<PageModel<GenericModel>>
export type MovementsSource = (request: { projectId: string | undefined }, params: MovementPageParamsModel) => Observable<PageModel<MovementModel>>

export type ItemSource = (id: string) => Observable<GenericModel>
export type LabelsSource = (prefix: string) => Observable<string[]>

export const ITEM_SOURCE: InjectionToken<ItemSource> = new InjectionToken<ItemSource>( 'item source' )
export const LABELS_SOURCE: InjectionToken<LabelsSource> = new InjectionToken<LabelsSource>( 'labels source' )
export const ITEMS_SOURCE: InjectionToken<ItemsSource> = new InjectionToken<ItemsSource>( 'items source' )
export const MOVEMENTS_SOURCE: InjectionToken<MovementsSource> = new InjectionToken<MovementsSource>( 'movements source' )
export const TEST_ERRORS: InjectionToken<ErrorSink> = new InjectionToken<ErrorSink>( 'errors' )

export const TestPagedStore = signalStore(
    withState<TestPagedState>( {
        items: PageStateHelper.initial<TestItemsParams, GenericModel>( { resetSearch: true, text: undefined } ),
        movements: PageStateHelper.initial<MovementPageParamsModel, MovementModel>( {
            resetSearch: false,
            currentMovements: true,
            linkedToActivity: undefined,
            visibilitySearched: undefined,
            typeSearched: undefined,
            startDateTimeSearched: undefined,
            endDateTimeSearched: undefined,
        } ),
        item: { element: undefined, loading: false },
        metadata: { labels: [] },
    } ),
    withMethods( (store, movementApi = inject( MovementApi ), errors = inject( TEST_ERRORS )) => ({
        fetchItems: pageFetcher( store, 'items', inject( ITEMS_SOURCE ), errors ),
        updateItemsParams: paramsUpdater( store, 'items' ),
        fetchContents: movementContentsFetcher( store, movementApi, errors ),
        fetchItem: elementFetcher( store, 'item', inject( ITEM_SOURCE ), errors ),
        fetchLabels: metadataFetcher( store, 'labels', inject( LABELS_SOURCE ), errors, (labels: string[]): string[] => [ '-', ...labels ] ),
        startItemLoader: loaderToggle( store, 'item', true ),
        stopItemLoader: loaderToggle( store, 'item', false ),
    }) ),
    withMethods( (store, errors = inject( TEST_ERRORS )) => ({
        fetchMovements: pageFetcher( store, 'movements', inject( MOVEMENTS_SOURCE ), errors, { after: contentsRequester( store.fetchContents ) } ),
    }) ),
)
