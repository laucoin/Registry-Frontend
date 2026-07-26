import * as oidc from 'openid-client'

/**
 * Nuxt builds the authorize URL (code flow + PKCE); the state and
 * verifier wait in a short-lived sealed cookie until the callback.
 *
 * The post-login `redirect` is restricted to same-site paths: a bare
 * `startsWith('/')` would admit protocol-relative URLs (`//evil.com`,
 * `/\evil.com`) that would send the browser off-origin.
 *
 * `offline_access` is what authorises a usable refresh token. Without it the
 * IdP still hands one out but refuses the refresh grant, so the BFF's renewal
 * fails, the session is cleared, and every user is bounced back to sign-in the
 * moment their access token expires instead of being renewed silently.
 */
export default defineEventHandler(async (event) => {
	if (!await isIdpReachable()) {
		return sendRedirect(event, '/?idp=down')
	}
	const config = await getIdpConfiguration()

	const codeVerifier = oidc.randomPKCECodeVerifier()
	const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
	const state = oidc.randomState()

	const requestedRedirect = getQuery(event).redirect
	const redirectTo
		= typeof requestedRedirect === 'string' && /^\/(?![/\\])/.test(requestedRedirect) ? requestedRedirect : '/'

	const flow = await useLoginFlowSession(event)
	await flow.update({ codeVerifier, state, redirectTo })

	const authorizationUrl = oidc.buildAuthorizationUrl(config, {
		redirect_uri: callbackUrl(event),
		scope: 'openid profile email offline_access',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
	})

	return sendRedirect(event, authorizationUrl.href)
})
