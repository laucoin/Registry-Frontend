import * as oidc from 'openid-client'

// ADR 022/024 — logout is state-changing: POST + synchronizer token. Returns
// the IdP end-session URL for the client to navigate to (RP-initiated logout).
export default defineEventHandler(async (event) => {
	const session = await peekSession(event)
	if (!session) {
		return { redirectUrl: '/' }
	}

	const csrfHeader = getHeader(event, 'x-csrf-token')
	if (!csrfHeader || csrfHeader !== session.data.csrf) {
		throw createError({ statusCode: 403, statusMessage: 'Invalid CSRF token' })
	}

	const config = await getIdpConfiguration()
	const idTokenSession = await useIdTokenSession(event)
	const idToken = idTokenSession.data.idToken
	await session.clear()
	await idTokenSession.clear()

	const endSessionUrl = oidc.buildEndSessionUrl(config, {
		post_logout_redirect_uri: new URL('/', getRequestURL(event).origin).href,
		...(idToken ? { id_token_hint: idToken } : {}),
	})
	return { redirectUrl: endSessionUrl.href }
})
