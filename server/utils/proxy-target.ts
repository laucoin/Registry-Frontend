import { joinURL } from 'ufo'

/**
 * `/api` is the confinement boundary of the whole BFF: whatever
 * reaches Spring through the proxy does so on a private host the browser cannot
 * call directly, carrying the user's Bearer token. Resolving the upstream URL is
 * therefore a security decision, not string concatenation, and lives here so it
 * can be covered without Nitro's request context.
 */

/**
 * Only satisfies the URL parser: an incoming request path is always
 * path-absolute, so it can never alter this authority — the real base is applied
 * afterwards by `joinURL`, which keeps any path prefix a deployment configured.
 */
const SENTINEL_ORIGIN = 'http://bff.invalid'

const API_PREFIX = '/api/'

/**
 * Resolve the upstream URL for an incoming proxy request, or return `null` when
 * the path escapes the `/api` prefix.
 *
 * `joinURL` does not remove dot segments (that is `joinRelativeURL`) while the
 * WHATWG parser inside `fetch` does, so concatenating a raw `/api/../actuator/env`
 * would silently reach management endpoints outside the API — h3 has already
 * percent-decoded `%2e`, and `..` is an ordinary segment to the router, so the
 * request arrives here intact. Normalizing with the same parser `fetch` uses and
 * then re-checking the prefix closes that gap; the caller rejects rather than
 * rewriting, so a traversal attempt never silently becomes a valid call.
 */
export function resolveProxyTarget(baseUrl: string, path: string): string | null {
	const requested = new URL(path, SENTINEL_ORIGIN)
	if (!requested.pathname.startsWith(API_PREFIX)) {
		return null
	}
	return joinURL(baseUrl, requested.pathname + requested.search)
}
