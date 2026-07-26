import { randomBytes } from 'node:crypto'
import * as oidc from 'openid-client'

/**
 * One-shot guard so a missing login-flow cookie self-heals via a single
 * /auth/login bounce instead of dead-ending on a 400 (or looping forever).
 * The flow cookie can be gone at the return leg for benign reasons — an
 * expired flow, a double-submitted callback (the code is single-use and the
 * flow is cleared on the first hit), or a session that died mid-login — and
 * the IdP SSO session is usually still valid, so the bounce comes straight
 * back authenticated. The guard cookie caps it at a single retry so a
 * genuinely unpersistable cookie can't loop.
 */
const LOGIN_RETRY_COOKIE = 'registry-login-retry'

/**
 * The code/PKCE exchange happens on the Nuxt server (client secret
 * never leaves it); the resulting tokens are sealed into the session cookies
 * (two-cookie split — see server/utils/session.ts). A TypeError from the code
 * exchange means the IdP died between the redirect and the exchange (a network
 * failure, not an OIDC protocol error) and lands on the same outage message as
 * login.
 */
export default defineEventHandler(async (event) => {
	const config = await getIdpConfiguration()

	const flow = await useLoginFlowSession(event)
	const { codeVerifier, state, redirectTo } = flow.data
	if (!codeVerifier || !state) {
		if (getCookie(event, LOGIN_RETRY_COOKIE)) {
			deleteCookie(event, LOGIN_RETRY_COOKIE, { path: '/' })
			throw createError({ statusCode: 400, statusMessage: 'Login flow expired — restart at /auth/login' })
		}
		setCookie(event, LOGIN_RETRY_COOKIE, '1', {
			httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 120,
		})
		return sendRedirect(event, '/auth/login')
	}
	deleteCookie(event, LOGIN_RETRY_COOKIE, { path: '/' })

	let tokens: Awaited<ReturnType<typeof oidc.authorizationCodeGrant>>
	try {
		tokens = await oidc.authorizationCodeGrant(config, getRequestURL(event), {
			pkceCodeVerifier: codeVerifier,
			expectedState: state,
		})
	} catch (error) {
		if (error instanceof TypeError) {
			return sendRedirect(event, '/?idp=down')
		}
		throw error
	}
	const claims = tokens.claims()
	if (!claims) {
		throw createError({ statusCode: 500, statusMessage: 'No ID token claims in token response' })
	}

	const session = await useRegistrySession(event)
	await session.update({
		user: {
			sub: claims.sub,
			email: claims.email as string | undefined,
			givenName: claims.given_name as string | undefined,
			familyName: claims.family_name as string | undefined,
			name: claims.name as string | undefined,
		},
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		expiresAt: Date.now() + (tokens.expires_in ?? 300) * 1000,
		csrf: randomBytes(24).toString('base64url'),
		createdAt: Date.now(),
		lastActivity: Date.now(),
	})
	const idTokenSession = await useIdTokenSession(event)
	await idTokenSession.update({ idToken: tokens.id_token })
	await flow.clear()

	const sizes = assertCookieSizes(event)
	console.info(`[registry] login for ${claims.sub} — sealed cookies: ${sizes.map(s => `${s.name}=${s.bytes}B`).join(', ')}`)

	return sendRedirect(event, redirectTo || '/')
})
