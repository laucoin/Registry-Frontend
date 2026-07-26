/**
 * The reset cascade, carried over from NGXS: selecting a different
 * project profile must reset all dependent feature state. Feature stores
 * (B2, code-split with their routes) register their *definition* here — never
 * an instance, which would leak state across SSR requests.
 *
 * // in a feature store module:
 * registerProjectScopedStore(useMovementsStore)
 *
 * The cascade instantiates each registered store for the current request/app
 * and calls its $reset().
 */
import type { StoreDefinition } from 'pinia'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStoreDefinition = StoreDefinition<string, any, any, any>

const projectScopedStores: AnyStoreDefinition[] = []

export function registerProjectScopedStore(definition: AnyStoreDefinition): void {
	if (!projectScopedStores.includes(definition)) {
		projectScopedStores.push(definition)
	}
}

export function resetProjectScopedState(): void {
	for (const definition of projectScopedStores) {
		definition().$reset()
	}
}
