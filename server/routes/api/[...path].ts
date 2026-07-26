import { REAUTH_REQUIRED_CODE, SERVICE_UNAVAILABLE_CODE } from '@shared/utils/api-errors'

/**
 * The BFF proxy: the browser only ever talks to Nuxt; Nuxt
 * forwards the user's IdP access token as Bearer to the (private) Spring
 * resource server, which keeps validating the JWT and enforcing RBAC. Version-
 * agnostic: the path (v1/v2) is forwarded as sent, once
 * resolveProxyTarget has confirmed it stays under the `/api` prefix that keeps
 * the rest of the private host out of reach.
 *
 * Reactive refresh: proactive refresh (ensureFreshAccessToken) covers
 * expiry, but a token can die out-of-band (revocation, clock skew) and Spring
 * answers 401. Here we run a manual fetch so that, on an upstream 401, we
 * refresh once and retry; if it still fails we clear the session and return a
 * 401 carrying `x-registry-reauth: 1` for the client to redirect to the IdP.
 *
 * EVERY auth-dead 401 this proxy emits must carry that header — a lapsed
 * session (idle/absolute expiry) and a failed proactive refresh are just as
 * re-login-able as the reactive path; a plain 401 would strand the client on
 * an error it deliberately doesn't act on.
 *
 * the correlation id is resolved before any early return, so even
 * auth/CSRF rejections carry it; it is echoed to the browser and forwarded to
 * Spring. Cookie-borne auth needs CSRF defense, so state-changing
 * methods require the synchronizer token. The request body is buffered once so
 * the 401 retry can replay it, and the upstream response is passed through
 * buffered rather than streamed — the API returns JSON, not large payloads.
 *
 * Every forwarded call carries the APP's language as `Accept-Language`, not the
 * browser's: Spring translates its error bodies and label values off that header
 * and the UI language is the user's actual choice (see backendLanguage). This is
 * the only place it can be enforced for both the SSR bootstrap and the browser,
 * which cannot set the header on its own fetches.
 *
 * An unreachable Spring (down, DNS, connection refused) is answered as a
 * recognizable 503 with a SERVICE_UNAVAILABLE code the client maps to a
 * translated notice, rather than letting the fetch rejection become a raw Nitro
 * 500 whose low-level text ("fetch failed") would leak into the UI. Both
 * upstream calls are covered: a rolling deploy is exactly when 401s cluster, so
 * the post-refresh retry is the likeliest one to hit a dead Spring.
 */

/**
 * Hop-by-hop / encoding headers we must not copy: `fetch` already decoded the
 * body, so a forwarded content-encoding/length would corrupt it. set-cookie is
 * stripped because cookies belong to the BFF session — copying an upstream one
 * (setResponseHeader replaces) would clobber the sealed session cookie a token
 * refresh just wrote to this same response, stranding the browser on a
 * consumed refresh token.
 */
const STRIP_UPSTREAM = new Set([
	'content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive',
	'set-cookie',
])

export default defineEventHandler(async (event) => {
	const rc = useRuntimeConfig(event)

	const correlationId = resolveCorrelationId(getHeader(event, CORRELATION_ID_HEADER))
	setResponseHeader(event, CORRELATION_ID_HEADER, correlationId)

	/**
	 * The body carries a CODE, never prose: this reply is a signal to redirect
	 * to the IdP, and any caller that renders `data.message` before the redirect
	 * lands would otherwise print an untranslated "Re-authentication required"
	 * at the user.
	 */
	const reauthRequired = (): { statusCode: number, code: string } => {
		setResponseHeader(event, 'x-registry-reauth', '1')
		setResponseStatus(event, 401)
		return { statusCode: 401, code: REAUTH_REQUIRED_CODE }
	}

	const session = await peekSession(event)
	if (!session?.data.accessToken) {
		return reauthRequired()
	}

	if (!['GET', 'HEAD', 'OPTIONS'].includes(event.method)) {
		const csrfHeader = getHeader(event, 'x-csrf-token')
		if (!csrfHeader || csrfHeader !== session.data.csrf) {
			throw createError({ statusCode: 403, statusMessage: 'Invalid CSRF token' })
		}
	}

	try {
		await ensureFreshAccessToken(event, session)
	} catch (error) {
		if (error instanceof Error && 'statusCode' in error && error.statusCode === 401) {
			return reauthRequired()
		}
		throw error
	}

	const target = resolveProxyTarget(rc.registryBaseUrl, event.path)
	if (target === null) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid API path' })
	}

	/**
	 * readRawBody hands back a Node Buffer, which TypeScript's ArrayBuffer /
	 * SharedArrayBuffer split leaves unassignable to BodyInit even though undici
	 * accepts it — cast rather than copy every write request's body.
	 */
	const body = (['GET', 'HEAD'].includes(event.method)
		? undefined
		: (await readRawBody(event, false)) ?? undefined) as BodyInit | undefined

	const forwardedHeaders: Record<string, string> = {}
	for (const [key, value] of Object.entries(getRequestHeaders(event))) {
		const name = key.toLowerCase()
		if (value == null || STRIP_UPSTREAM.has(name)) {
			continue
		}
		if (['host', 'cookie', 'authorization', 'x-csrf-token'].includes(name)) {
			continue
		}
		forwardedHeaders[name] = value
	}

	forwardedHeaders['accept-language'] = backendLanguage(event)

	const callUpstream = (token: string): Promise<Response> =>
		fetch(target, {
			method: event.method,
			headers: {
				...forwardedHeaders,
				authorization: `Bearer ${token}`,
				[CORRELATION_ID_HEADER]: correlationId,
			},
			body,
			redirect: 'manual',
		})

	const serviceUnavailable = () => {
		setResponseStatus(event, 503)
		return { statusCode: 503, code: SERVICE_UNAVAILABLE_CODE, message: '' }
	}

	let upstream: Response
	try {
		upstream = await callUpstream(session.data.accessToken)
	} catch {
		return serviceUnavailable()
	}

	if (upstream.status === 401) {
		const refreshed = await refreshAccessToken(event, session)
		if (refreshed) {
			try {
				upstream = await callUpstream(session.data.accessToken)
			} catch {
				return serviceUnavailable()
			}
		}
		if (!refreshed || upstream.status === 401) {
			await session.clear()
			return reauthRequired()
		}
	}

	setResponseStatus(event, upstream.status)
	upstream.headers.forEach((value, key) => {
		if (!STRIP_UPSTREAM.has(key.toLowerCase())) {
			setResponseHeader(event, key, value)
		}
	})
	setResponseHeader(event, CORRELATION_ID_HEADER, correlationId)

	return Buffer.from(await upstream.arrayBuffer())
})
