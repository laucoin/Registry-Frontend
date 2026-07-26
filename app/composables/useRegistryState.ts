import type { RegistryConfig } from '@shared/utils/registry-config'

/**
 * The validated public config, embedded in the SSR payload by
 * app/plugins/01.registry-init.ts and hydrated on the client. Static
 * server-provided data, so it lives in useState rather than a Pinia store.
 */
export function useRegistryConfigState() {
	return useState<RegistryConfig | null>('registry-config', () => null)
}

/**
 * The per-request CSP nonce (SSR); reused by anything that must
 * inject inline content.
 */
export function useCspNonce() {
	return useState<string>('csp-nonce', () => '')
}
