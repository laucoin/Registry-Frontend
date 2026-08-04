import { useSessionStore } from '@stores/session'

// ADR 022 / 025 — a live 401 that the BFF tried and failed to refresh comes back
// with `x-registry-reauth: 1` (the session was cleared server-side). Turn that
// into a full-page redirect to the IdP so an out-of-band session death
// self-heals instead of surfacing as an error. Client-only: the redirect
// (`login()` → `navigateTo(external)`) only makes sense in the browser; an
// ordinary 401 without the signal (e.g. an anonymous call) is left untouched.
export default defineNuxtPlugin((nuxtApp) => {
	let redirecting = false

	globalThis.$fetch = globalThis.$fetch.create({
		onResponseError({ response }) {
			if (redirecting || response?.status !== 401) {
				return
			}
			if (response.headers.get('x-registry-reauth') !== '1') {
				return
			}
			redirecting = true
			nuxtApp.runWithContext(() => {
				useSessionStore().login(useRoute().fullPath)
			})
		},
	})
})
