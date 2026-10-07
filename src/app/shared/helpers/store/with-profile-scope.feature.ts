import { DestroyRef, inject } from '@angular/core'
import { getState, patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'

// Resets the store to its initial state on a profile switch; `preserve` keeps data that survives it.
export function withProfileScope<S extends object> (initial: S, preserve?: (current: S) => Partial<S>) {
    return signalStoreFeature(
        { state: type<S>() },
        withHooks( {
            onInit (store): void {
                const unregister: () => void = inject( ProfileResetService ).register( (): void => {
                    patchState( store, { ...initial, ...preserve?.( getState( store ) as S ) } as Partial<S> )
                } )
                inject( DestroyRef ).onDestroy( unregister )
            },
        } ),
    )
}
