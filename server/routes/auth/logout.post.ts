import * as oidc from 'openid-client'

/**
 * Logout is state-changing: POST + synchronizer token. Returns
 * the IdP end-session URL for the client to navigate to (RP-initiated logout).
 *
 * A lapsed session (idle/absolute expiry) still has to log out for real: the
 * companion id_token cookie outlives it by design (see peekIdTokenSession), so
 * signing out after idling must still clear that cookie AND end the IdP's SSO
 * session — otherwise the next "Sign in" silently signs the user straight back
 * in. With no session there is no synchronizer token to check; SameSite=Lax
 * keeps a cross-site POST from carrying the cookie in the first place.
 */
export default defineEventHandler(async (event) => {
	const session = await peekSession(event)
	if (session) {
		const csrfHeader = getHeader(event, 'x-csrf-token')
		if (!csrfHeader || csrfHeader !== session.data.csrf) {
			throw createError({ statusCode: 403, statusMessage: 'Invalid CSRF token' })
		}
	}

	const idTokenSession = await peekIdTokenSession(event)
	const idToken = idTokenSession?.data.idToken
	await session?.clear()
	await idTokenSession?.clear()

	if (!session && !idToken) {
		return { redirectUrl: '/' }
	}

	const config = await getIdpConfiguration()
	const endSessionUrl = oidc.buildEndSessionUrl(config, {
		post_logout_redirect_uri: new URL('/', getRequestURL(event).origin).href,
		...(idToken ? { id_token_hint: idToken } : {}),
	})
	return { redirectUrl: endSessionUrl.href }
})
