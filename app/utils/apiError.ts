import type { FetchError } from 'ofetch'

// A service-unavailable failure carries no Spring-translated body (Spring is the
// thing that's down), so the message is localized client-side. Statuses: 0/no
// response (Nuxt or network unreachable), and 502/503/504 — including the
// proxy's own SERVICE_UNAVAILABLE 503 when it can't reach Spring.
const SERVICE_UNAVAILABLE_FALLBACK = 'Service temporarily unavailable. Please try again shortly.'

function isServiceUnavailable(error: unknown): boolean {
	const fetchError = error as FetchError | undefined
	const data = fetchError?.data as { code?: string } | undefined
	if (data?.code === 'SERVICE_UNAVAILABLE') {
		return true
	}
	const status = fetchError?.statusCode
	return status === 0 || status === 502 || status === 503 || status === 504
}

// The backend's ErrorDto ({ statusCode, statusName, code, title, message }) is
// forwarded verbatim through the BFF proxy, so a failed $fetch carries it on
// `error.data`. `message` is already translated server-side (errors bundle), so
// prefer it; fall back to the title. A service outage has no translated body, so
// it maps to a localized "unavailable" notice (via the optional `t`) rather than
// leaking a raw "fetch failed". Use this everywhere a backend failure is shown
// to the user.
export function apiErrorMessage(error: unknown, t?: (key: string) => string): string {
	const data = (error as FetchError)?.data as { message?: string, title?: string } | undefined
	if (!data?.message && !data?.title && isServiceUnavailable(error)) {
		return t?.('common.serviceUnavailable') ?? SERVICE_UNAVAILABLE_FALLBACK
	}
	return data?.message ?? data?.title ?? (error instanceof Error ? error.message : String(error))
}
