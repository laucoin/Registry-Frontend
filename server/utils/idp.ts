import type { useRegistrySession } from '@server/utils/session'
import type { H3Event } from 'h3'
import * as oidc from 'openid-client'

let configPromise: Promise<oidc.Configuration> | undefined

/**
 * Nuxt is the OIDC client: discovery + client secret live only here.
 * Discovery is memoized, and a failed attempt resets the memo so a later call
 * retries once the IdP is back. The local Authentik is plain http, so http
 * issuers opt into allowInsecureRequests; production issuers are https.
 */
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

interface RefreshedTokens {
	accessToken: string
	refreshToken: string
	expiresAt: number
}

/**
 * How long a completed refresh stays replayable for the token it consumed.
 * Covers the window during which requests the browser had already sent still
 * carry the previous cookie; long enough for an in-flight burst, far shorter
 * than any access-token lifetime.
 */
const REFRESH_REPLAY_WINDOW_MS = 10_000

/**
 * Memoizes "what this refresh token became", keyed by the token that was
 * consumed. A dashboard fires many API calls at once; without this each would
 * call refreshTokenGrant with the same refresh token, and an IdP that rotates
 * them (Authentik does) revokes the whole family on the second use — silently
 * killing a live session that then surfaces as a spurious re-login.
 *
 * The entry deliberately OUTLIVES the grant by REFRESH_REPLAY_WINDOW_MS.
 * Evicting it the moment the grant settled only covered requests that happened
 * to overlap in time: a request the browser sent before it received any of the
 * rotated cookies still presents the consumed token, and replaying it at the
 * IdP is exactly the reuse that kills the session. Keeping the result cannot go
 * stale — consuming a given refresh token has one outcome, forever — and the
 * next refresh is keyed by the NEW token, so it never reads this entry.
 * A rejected grant is evicted immediately: failure is not an outcome worth
 * replaying, and a transient one must be allowed to retry.
 */
const refreshInFlight = new Map<string, Promise<RefreshedTokens>>()

function forgetRefresh(consumedToken: string, grant: Promise<RefreshedTokens>): void {
	if (refreshInFlight.get(consumedToken) === grant) {
		refreshInFlight.delete(consumedToken)
	}
}

function rememberRefresh(consumedToken: string, grant: Promise<RefreshedTokens>): void {
	refreshInFlight.set(consumedToken, grant)
	grant.then(
		() => {
			const timer = setTimeout(() => forgetRefresh(consumedToken, grant), REFRESH_REPLAY_WINDOW_MS)
			;(timer as { unref?: () => void }).unref?.()
		},
		() => forgetRefresh(consumedToken, grant),
	)
}

/**
 * Force a token refresh now. Used both proactively (below, on
 * expiry skew) and reactively (the proxy, on an upstream 401). Returns true on
 * success; on a missing/rejected refresh token it clears the session and
 * returns false so the caller can signal re-login. A non-OIDC error with a
 * statusCode (e.g. the 4 KB cookie ceiling from assertCookieSizes) propagates
 * unchanged rather than being masked as a refresh failure. Only an explicit
 * OAuth error response (invalid_grant &co.) means the refresh token is dead;
 * anything else — network failure, timeout, IdP 5xx — is transient, so the
 * session is kept and the request is allowed to fail instead.
 */
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
			grant = oidc.refreshTokenGrant(config, refreshToken).then(tokens => ({
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token ?? refreshToken,
				expiresAt: Date.now() + (tokens.expires_in ?? 300) * 1000,
			}))
			rememberRefresh(refreshToken, grant)
		}
		const tokens = await grant
		await session.update({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			expiresAt: tokens.expiresAt,
		})
		assertCookieSizes(event)
		return true
	} catch (error) {
		if (error instanceof Error && 'statusCode' in error) {
			throw error
		}
		if (error instanceof oidc.ResponseBodyError) {
			await session.clear()
			return false
		}
		throw error
	}
}

/**
 * Proactive refresh: transparently renew the access token shortly
 * before expiry. Throws 401 when the refresh token is gone/rejected so callers
 * surface a re-login instead of forwarding a dead token.
 */
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

/**
 * Active IdP reachability probe. The discovery config is cached after the
 * first success, so by itself it can't tell a live IdP from a dead one — and
 * redirecting the browser to a dead IdP strands the user on a raw
 * connection-refused page. Login probes this first and shows an explicit
 * "sign-in unavailable" message instead. Logins are rare; one extra ~request
 * per attempt is free.
 */
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
