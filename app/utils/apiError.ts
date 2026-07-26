import { errorBody, isReauthRequired, SERVICE_UNAVAILABLE_CODE } from '@shared/utils/api-errors'
import type { FetchError } from 'ofetch'

/**
 * A service-unavailable failure carries no Spring-translated body (Spring is the
 * thing that's down), so the message is localized client-side. Statuses: 0/no
 * response (Nuxt or network unreachable), and 502/503/504 — including the
 * proxy's own SERVICE_UNAVAILABLE 503 when it can't reach Spring.
 */
const SERVICE_UNAVAILABLE_FALLBACK = 'Service temporarily unavailable. Please try again shortly.'

/**
 * The BFF's re-authentication signal has no body either: it means "your session
 * is gone, you are being sent back to sign in". A caller that catches the
 * rejection before the redirect lands still needs something to show, and it must
 * not be the proxy's internal English wording.
 */
const SESSION_EXPIRED_FALLBACK = 'Your session has expired. Signing you in again…'

/**
 * The failures that mean "the backend is not answering" rather than "the backend
 * refused you": the proxy's own SERVICE_UNAVAILABLE, and the statuses a dead or
 * unreachable hop produces. They carry no translated body, so every surface that
 * shows one — the inline notice and the global error screen — has to recognise
 * them to localize the wording itself.
 */
export function isServiceUnavailable(error: unknown): boolean {
	const fetchError = error as FetchError | undefined
	if (errorBody(error)?.code === SERVICE_UNAVAILABLE_CODE) {
		return true
	}
	const status = fetchError?.statusCode
	return status === 0 || status === 502 || status === 503 || status === 504
}

/**
 * The backend's ErrorDto ({ statusCode, statusName, code, title, message }) is
 * forwarded verbatim through the BFF proxy, so a failed $fetch carries it on
 * `error.data`. `message` is already translated server-side (errors bundle), so
 * prefer it; fall back to the title. A failure the BFF itself produced has no
 * translated body — a service outage and a dead session both map to a localized
 * notice (via the optional `t`) rather than leaking a raw "fetch failed" or the
 * proxy's internal wording. Use this everywhere a backend failure is shown
 * to the user.
 */
export function apiErrorMessage(error: unknown, t?: (key: string) => string): string {
	const data = (error as FetchError)?.data as { message?: string, title?: string } | undefined
	if (!data?.message && !data?.title) {
		if (isReauthRequired(error)) {
			return t?.('common.sessionExpired') ?? SESSION_EXPIRED_FALLBACK
		}
		if (isServiceUnavailable(error)) {
			return t?.('common.serviceUnavailable') ?? SERVICE_UNAVAILABLE_FALLBACK
		}
	}
	return data?.message ?? data?.title ?? (error instanceof Error ? error.message : String(error))
}
