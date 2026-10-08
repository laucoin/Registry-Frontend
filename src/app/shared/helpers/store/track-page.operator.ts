import { Signal } from '@angular/core'
import { patchState, WritableStateSource } from '@ngrx/signals'
import { catchError, EMPTY, finalize, Observable } from 'rxjs'
import { RegistryFacade } from '@core/registry/state/registry.facade'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { initialize, reportError } from '@shared/helpers/rx.helper'

type PageBlock = PageRequestInformationModel<unknown, GenericModel>

/**
 * Purpose: Gives read and write access to one page block of a signal store state.
 * Scope: Lets generic operators update the loading and error state of a single paged resource.
 * Limits: Does not own any state; it only forwards to the store it was built from.
 */
export interface PageSlice<B extends PageBlock> {
    read: () => B
    write: (block: B) => void
}

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
 * Purpose: Scopes the loading flags and the failure of a page request to the given page block.
 * Scope: Marks the block loading while in flight, then reports a 503 globally or stores any other error in the block.
 * Limits: Swallows the error (completes empty) so the surrounding rxMethod stays alive; it does not fetch anything.
 */
export const trackPage = <B extends PageBlock>(registryFacade: RegistryFacade, slice: PageSlice<B>) =>
    <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => setLoading( slice, true ) ),
        finalize( (): void => setLoading( slice, false ) ),
        catchError( (error: ErrorModel): Observable<never> => handleFailure( registryFacade, slice, error ) ),
    )

function setLoading<B extends PageBlock>(slice: PageSlice<B>, loading: boolean): void {
    const block: B = slice.read()
    slice.write( { ...block, ...StateHelper.updatePageLoader( block, loading ) } )
}

function handleFailure<B extends PageBlock>(registryFacade: RegistryFacade, slice: PageSlice<B>, error: ErrorModel): Observable<never> {
    if (error.status === 503) {
        reportError( registryFacade, error )
    } else {
        const block: B = slice.read()
        slice.write( { ...block, ...PageStateHelper.withError( block, error ) } )
    }
    return EMPTY
}
