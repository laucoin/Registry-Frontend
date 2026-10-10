import { DestroyRef, inject } from '@angular/core'
import { getState, patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals'
import { ProfileResetService } from '@shared/helpers/store/profile-reset.service'

/**
 * Purpose: Signal store feature that resets a store on a profile switch.
 * Scope: Registers the store reset with the profile reset service and unregisters it on destroy.
 * Limits: Preserved data is chosen by the store; it does not reset on route changes.
 */
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
