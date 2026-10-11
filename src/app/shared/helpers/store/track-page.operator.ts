import { Signal } from '@angular/core'
import { patchState, WritableStateSource } from '@ngrx/signals'
import { catchError, EMPTY, finalize, Observable } from 'rxjs'
import { ErrorModel } from '@shared/models/model/error.model'
import { GenericModel } from '@shared/models/model/generic.model'
import { PageRequestInformationModel } from '@shared/models/model/page-request-information.model'
import { PageStateHelper } from '@shared/helpers/store/page-state.helper'
import { StateHelper } from '@shared/helpers/state/state.helper'
import { ErrorSink, initialize, reportError } from '@shared/helpers/rx.helper'

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

/**
 * Purpose: Gives a page block of a store the read and write access the page operators need.
 * Scope: Reads the block of a key and patches it back.
 * Limits: Only wraps the store; it does not fetch anything.
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
 * Purpose: Scopes the loading flags and the failure of a page request to the given page block.
 * Scope: Marks the block loading while in flight, then reports a 503 globally or stores any other error in the block.
 * Limits: Swallows the error (completes empty) so the surrounding rxMethod stays alive; it does not fetch anything.
 */
export const trackPage = <B extends PageBlock>(errorSink: ErrorSink, slice: PageSlice<B>) =>
    <T> (source: Observable<T>): Observable<T> => source.pipe(
        initialize( (): void => setLoading( slice, true ) ),
        finalize( (): void => setLoading( slice, false ) ),
        catchError( (error: ErrorModel): Observable<never> => handleFailure( errorSink, slice, error ) ),
    )

/**
 * Purpose: Starts or stops the loading state of a page block.
 * Scope: Clears the previous error when a load starts.
 * Limits: Does not touch the page itself.
 */
function setLoading<B extends PageBlock>(slice: PageSlice<B>, loading: boolean): void {
    const block: B = slice.read()
    const cleared: B = loading ? { ...block, error: undefined } : block
    slice.write( { ...cleared, ...StateHelper.updatePageLoader( cleared, loading ) } )
}

/**
 * Purpose: Keeps a page fetch failure in its block, or reports an unavailable backend globally.
 * Scope: Splits the 503 errors from the others.
 * Limits: Always ends the stream without a value so the calling method stays usable.
 */
function handleFailure<B extends PageBlock>(errorSink: ErrorSink, slice: PageSlice<B>, error: ErrorModel): Observable<never> {
    if (error.status === 503) {
        reportError( errorSink, error )
    } else {
        const block: B = slice.read()
        slice.write( { ...block, ...PageStateHelper.withError( block, error ) } )
    }
    return EMPTY
}
