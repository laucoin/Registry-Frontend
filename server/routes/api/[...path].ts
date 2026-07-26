import { joinURL } from 'ufo'

// ADR 022 / 025 — the BFF proxy: the browser only ever talks to Nuxt; Nuxt
// forwards the user's IdP access token as Bearer to the (private) Spring
// resource server, which keeps validating the JWT and enforcing RBAC. Version-
// agnostic: the path (v1/v2, ADR 017) is forwarded untouched.
//
// Reactive refresh (ADR 025): proactive refresh (ensureFreshAccessToken) covers
// expiry, but a token can die out-of-band (revocation, clock skew) and Spring
// answers 401. Here we run a manual fetch so that, on an upstream 401, we
// refresh once and retry; if it still fails we clear the session and return a
// 401 carrying `x-registry-reauth: 1` for the client to redirect to the IdP.
//
// EVERY auth-dead 401 this proxy emits must carry that header — a lapsed
// session (idle/absolute expiry) and a failed proactive refresh are just as
// re-login-able as the reactive path; a plain 401 would strand the client on
// an error it deliberately doesn't act on.
//
// ADR 020 — the correlation id is resolved before any early return, so even
// auth/CSRF rejections carry it; it is echoed to the browser and forwarded to
// Spring. ADR 024 — cookie-borne auth needs CSRF defense, so state-changing
// methods require the synchronizer token. The request body is buffered once so
// the 401 retry can replay it, and the upstream response is passed through
// buffered rather than streamed — the API returns JSON, not large payloads.

// Hop-by-hop / encoding headers we must not copy: `fetch` already decoded the
// body, so a forwarded content-encoding/length would corrupt it. set-cookie is
// stripped because cookies belong to the BFF session — copying an upstream one
// (setResponseHeader replaces) would clobber the sealed session cookie a token
// refresh just wrote to this same response, stranding the browser on a
// consumed refresh token.
const STRIP_UPSTREAM = new Set([
	'content-encoding', 'content-length', 'transfer-encoding', 'connection', 'keep-alive',
	'set-cookie',
])

export default defineEventHandler(async (event) => {
	const rc = useRuntimeConfig(event)

	const correlationId = resolveCorrelationId(getHeader(event, CORRELATION_ID_HEADER))
	setResponseHeader(event, CORRELATION_ID_HEADER, correlationId)

	const reauthRequired = (): { statusCode: number, message: string } => {
		setResponseHeader(event, 'x-registry-reauth', '1')
		setResponseStatus(event, 401)
		return { statusCode: 401, message: 'Re-authentication required' }
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

	const target = joinURL(rc.registryBaseUrl, event.path)
	const body = ['GET', 'HEAD'].includes(event.method)
		? undefined
		: (await readRawBody(event, false)) ?? undefined

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

	let upstream: Response
	try {
		upstream = await callUpstream(session.data.accessToken)
	} catch {
		// Spring unreachable (down, DNS, connection refused): surface a recognizable
		// 503 with a code the client maps to a translated "service unavailable"
		// message, instead of letting the fetch rejection become a raw Nitro 500
		// whose low-level text ("fetch failed") would leak into the UI.
		setResponseStatus(event, 503)
		return { statusCode: 503, code: 'SERVICE_UNAVAILABLE', message: '' }
	}

	if (upstream.status === 401) {
		const refreshed = await refreshAccessToken(event, session)
		if (refreshed) {
			upstream = await callUpstream(session.data.accessToken)
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
