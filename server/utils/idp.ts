import type { useRegistrySession } from '@server/utils/session'
import type { H3Event } from 'h3'
import * as oidc from 'openid-client'

let configPromise: Promise<oidc.Configuration> | undefined

// ADR 022 — Nuxt is the OIDC client: discovery + client secret live only here.
// Discovery is memoized, and a failed attempt resets the memo so a later call
// retries once the IdP is back. Local Keycloak is plain http, so http issuers
// opt into allowInsecureRequests; production issuers are https.
export function getIdpConfiguration(): Promise<oidc.Configuration> {
	if (!configPromise) {
		const rc = useRuntimeConfig()
		const issuer = new URL(rc.idp.issuer)
		const promise = oidc.discovery(
			issuer,
			rc.idp.clientId,
			rc.idp.clientSecret,
			undefined,
			issuer.protocol === 'http:' ? { execute: [oidc.allowInsecureRequests] } : undefined,
		)
		promise.catch(() => {
			configPromise = undefined
		})
		configPromise = promise
	}
	return configPromise
}

type RegistrySession = Awaited<ReturnType<typeof useRegistrySession>>

// Coalesce concurrent refreshes of the SAME refresh token into one network
// call, keyed by the token value. A dashboard fires many API calls at once;
// without this each would call refreshTokenGrant with the same refresh token,
// and an IdP that rotates refresh tokens (Keycloak's reuse detection) revokes
// the whole family on the second use — silently killing a live session. With
// the dedupe only one grant runs; every concurrent caller applies its result.
// Entries live only for the burst: a settled grant must never be reused, since
// rotation would make its result stale.
const refreshInFlight = new Map<string, ReturnType<typeof oidc.refreshTokenGrant>>()

// ADR 022 / 025 — force a token refresh now. Used both proactively (below, on
// expiry skew) and reactively (the proxy, on an upstream 401). Returns true on
// success; on a missing/rejected refresh token it clears the session and
// returns false so the caller can signal re-login. A non-OIDC error with a
// statusCode (e.g. the 4 KB cookie ceiling from assertCookieSizes) propagates
// unchanged rather than being masked as a refresh failure.
export async function refreshAccessToken(event: H3Event, session: RegistrySession): Promise<boolean> {
	const data = session.data
	if (!data.refreshToken) {
		await session.clear()
		return false
	}
	const refreshToken = data.refreshToken
	const config = await getIdpConfiguration()
	try {
		let grant = refreshInFlight.get(refreshToken)
		if (!grant) {
			grant = oidc.refreshTokenGrant(config, refreshToken)
			refreshInFlight.set(refreshToken, grant)
			void grant.catch(() => {
			}).finally(() => {
				if (refreshInFlight.get(refreshToken) === grant) {
					refreshInFlight.delete(refreshToken)
				}
			})
		}
		const tokens = await grant
		await session.update({
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token ?? refreshToken,
			expiresAt: Date.now() + (tokens.expires_in ?? 300) * 1000,
		})
		assertCookieSizes(event)
		return true
	} catch (error) {
		if (error instanceof Error && 'statusCode' in error) {
			throw error
		}
		// Only an explicit OAuth error response (invalid_grant &co.) means the
		// refresh token is dead. Anything else — network failure, timeout, IdP
		// 5xx — is transient: keep the session and let the request fail so a
		// retry can succeed once the IdP is back.
		if (error instanceof oidc.ResponseBodyError) {
			await session.clear()
			return false
		}
		throw error
	}
}

// ADR 022 — proactive refresh: transparently renew the access token shortly
// before expiry. Throws 401 when the refresh token is gone/rejected so callers
// surface a re-login instead of forwarding a dead token.
export async function ensureFreshAccessToken(event: H3Event, session: RegistrySession): Promise<void> {
	const data = session.data
	if (!data.expiresAt || Date.now() < data.expiresAt - 30_000) {
		return
	}
	if (!await refreshAccessToken(event, session)) {
		throw createError({ statusCode: 401, statusMessage: 'Session expired' })
	}
}

export function callbackUrl(event: H3Event): string {
	return new URL('/auth/callback', getRequestURL(event).origin).href
}

// Active IdP reachability probe. The discovery config is cached after the
// first success, so by itself it can't tell a live IdP from a dead one — and
// redirecting the browser to a dead IdP strands the user on a raw
// connection-refused page. Login probes this first and shows an explicit
// "sign-in unavailable" message instead. Logins are rare; one extra ~request
// per attempt is free.
export async function isIdpReachable(): Promise<boolean> {
	const rc = useRuntimeConfig()
	try {
		const wellKnown = new URL('.well-known/openid-configuration', `${rc.idp.issuer.replace(/\/$/, '')}/`)
		const response = await fetch(wellKnown, { signal: AbortSignal.timeout(2500) })
		return response.ok
	} catch {
		return false
	}
}
