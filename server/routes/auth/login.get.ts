import * as oidc from 'openid-client'

// ADR 022 — Nuxt builds the authorize URL (code flow + PKCE); the state and
// verifier wait in a short-lived sealed cookie until the callback.
export default defineEventHandler(async (event) => {
	if (!await isIdpReachable()) {
		return sendRedirect(event, '/?idp=down')
	}
	const config = await getIdpConfiguration()

	const codeVerifier = oidc.randomPKCECodeVerifier()
	const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
	const state = oidc.randomState()

	// Same-site paths only: a bare startsWith('/') would admit protocol-relative
	// URLs (`//evil.com`, `/\evil.com`) that the post-login redirect would send
	// the browser off-origin to.
	const requestedRedirect = getQuery(event).redirect
	const redirectTo
		= typeof requestedRedirect === 'string' && /^\/(?![/\\])/.test(requestedRedirect) ? requestedRedirect : '/'

	const flow = await useLoginFlowSession(event)
	await flow.update({ codeVerifier, state, redirectTo })

	const authorizationUrl = oidc.buildAuthorizationUrl(config, {
		redirect_uri: callbackUrl(event),
		scope: 'openid profile email',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
	})

	return sendRedirect(event, authorizationUrl.href)
})
