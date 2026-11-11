import { DestroyRef, inject } from '@angular/core';

import { getState, patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals';

import { ProfileResetService } from '@shared/helpers/store/profile-reset.service';

/**
 * Objectif: Feature de signal store qui réinitialise un store lors d'un changement de profil.
 * Périmètre: Enregistre la réinitialisation du store auprès du service de réinitialisation de profil et la désenregistre à la destruction.
 * Limites: Les données conservées sont choisies par le store ; il ne se réinitialise pas aux changements de route.
 */
export function withProfileScope<S extends object>(initial: S, preserve?: (current: S) => Partial<S>) {
	return signalStoreFeature(
		{ state: type<S>() },
		withHooks({
			onInit(store): void {
				const unregister = inject(ProfileResetService).register(() =>
					patchState(store, { ...initial, ...preserve?.(getState(store) as S) } as Partial<S>),
				);
				inject(DestroyRef).onDestroy(unregister);
			},
		}),
	);
}
