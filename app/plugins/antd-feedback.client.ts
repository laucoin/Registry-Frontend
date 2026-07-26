import { configureRegistryToasts } from '@/composables/useRegistryMessage'

/**
 * AntD keeps message placement in module-level config, so the toast position is
 * set once at boot rather than repeated at every call site. Client-only: the
 * feedback APIs render into a portal that only exists in the browser, and
 * touching their module state during SSR would leak across requests.
 */
export default defineNuxtPlugin(() => {
	configureRegistryToasts()
})
