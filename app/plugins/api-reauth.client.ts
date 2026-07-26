import { authRefusal } from '@shared/utils/api-errors'
import { useSessionStore } from '@stores/session'

/**
 * The two ways an authenticated call can fail for a reason no page
 * can act on, both collapsed here so the user sees ONE outcome instead of one
 * notice per in-flight request:
 *
 *  - `x-registry-reauth: 1` on a 401: the BFF tried to refresh and failed, and
 *    has cleared the session. Turn it into a full-page redirect to the IdP so an
 *    out-of-band session death self-heals instead of surfacing as an error. A
 *    401 WITHOUT the signal is left untouched — that is a live session being
 *    told "no", not a dead one.
 *  - a sign-in refusal from Spring (unverified address, address already held,
 *    blocked account): raised while converting the token, so it fails EVERY
 *    call the page makes for as long as the account stays in that state. Show
 *    the global error page once, carrying the backend's translated reason.
 *
 * Both latches are one-way on purpose: the first hit decides, and the responses
 * still streaming in behind it change nothing.
 *
 * Client-only: the redirect and the error page both belong to the browser, and
 * overriding globalThis.$fetch on the server would leak across requests. The SSR
 * side of the same two cases is handled in 01.registry-init.ts.
 */
export default defineNuxtPlugin((nuxtApp) => {
	let handled = false

	globalThis.$fetch = globalThis.$fetch.create({
		onResponseError({ response }) {
			if (handled) {
				return
			}

			const refusal = authRefusal({ data: response?._data })
			if (refusal) {
				handled = true
				nuxtApp.runWithContext(() => showError(createError({
					statusCode: refusal.statusCode ?? response.status,
					statusMessage: refusal.code,
					data: { code: refusal.code, message: refusal.message ?? refusal.title },
					fatal: true,
				})))
				return
			}

			if (response?.status !== 401 || response.headers.get('x-registry-reauth') !== '1') {
				return
			}
			handled = true
			nuxtApp.runWithContext(() => {
				useSessionStore().login(useRoute().fullPath)
			})
		},
	})
})
