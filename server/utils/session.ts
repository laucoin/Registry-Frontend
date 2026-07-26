import type { SessionUser } from '@shared/utils/registry-config'
import type { H3Event } from 'h3'

/**
 * Stateless sealed-cookie sessions (default option), hardened per
 * the Phase-0 spike findings:
 * - TWO cookies: the main session (user + access/refresh tokens + CSRF) and a
 * companion holding only the id_token (logout's id_token_hint). A single
 * cookie measured 5073 B > the ~4096 B ceiling and browsers drop it
 * silently.
 * - __Host- prefix in production (https); plain names over local http.
 * - No cookie is created for anonymous visitors: all read paths must go
 * through peekSession()/peekIdTokenSession(), which return null when the
 * cookie is absent instead of letting h3 mint an empty session.
 */

/**
 * Two-tier session lifetime. `createdAt` fixes an absolute cap (a
 * session can't outlive `session.maxAge` from login, regardless of activity);
 * `lastActivity` drives a sliding idle-timeout (`session.idleMaxAge`). Both are
 * enforced server-side in peekSession — the sealed-cookie Max-Age is only a
 * backstop.
 */
export interface RegistrySessionData {
	user?: SessionUser
	accessToken?: string
	refreshToken?: string
	expiresAt?: number
	csrf?: string
	createdAt?: number
	lastActivity?: number
}

/**
 * Don't re-seal the cookie on every request — only slide the idle window after
 * this much time. Capped at half the idle window so an active user always
 * refreshes before it lapses (matters when idleMaxAge is small).
 */
const MAX_IDLE_TOUCH_THROTTLE_MS = 60_000

function idleTouchThrottleMs(idleMs: number): number {
	return Math.min(MAX_IDLE_TOUCH_THROTTLE_MS, idleMs / 2)
}

/**
 * Pure two-tier expiry check (unit-tested): expired if the absolute cap OR the
 * idle window is exceeded.
 */
export function isSessionExpired(
	now: number,
	createdAt: number,
	lastActivity: number,
	absoluteMs: number,
	idleMs: number,
): boolean {
	return now - createdAt > absoluteMs || now - lastActivity > idleMs
}

/**
 * The browser limit is ~4096 bytes for the whole Set-Cookie value; sealed
 * payloads beyond this are dropped SILENTLY, so exceeding it is a hard error.
 */
export const COOKIE_BYTE_LIMIT = 4096

function isProduction(event: H3Event): boolean {
	return useRuntimeConfig(event).production === true
}

export function sessionCookieName(event: H3Event): string {
	return isProduction(event) ? '__Host-registry-session' : 'registry-session'
}

export function idTokenCookieName(event: H3Event): string {
	return isProduction(event) ? '__Host-registry-session-idt' : 'registry-session-idt'
}

function loginFlowCookieName(event: H3Event): string {
	return isProduction(event) ? '__Host-registry-login-flow' : 'registry-login-flow'
}

/**
 * `secure: true` stays unconditional: the production __Host- prefix requires
 * it, and Chrome/Firefox accept Secure cookies on http://localhost anyway.
 */
function cookieOptions() {
	return {
		httpOnly: true,
		secure: true,
		sameSite: 'lax' as const,
		path: '/',
	}
}

export function useRegistrySession(event: H3Event) {
	const rc = useRuntimeConfig(event)
	return useSession<RegistrySessionData>(event, {
		password: rc.session.secret,
		name: sessionCookieName(event),
		maxAge: rc.session.maxAge,
		cookie: cookieOptions(),
	})
}

export function useIdTokenSession(event: H3Event) {
	const rc = useRuntimeConfig(event)
	return useSession<{ idToken?: string }>(event, {
		password: rc.session.secret,
		name: idTokenCookieName(event),
		maxAge: rc.session.maxAge,
		cookie: cookieOptions(),
	})
}

/**
 * Short-lived cookie holding the in-flight OIDC state + PKCE verifier between
 * /auth/login and /auth/callback.
 */
export function useLoginFlowSession(event: H3Event) {
	const rc = useRuntimeConfig(event)
	return useSession<{ state?: string, codeVerifier?: string, redirectTo?: string }>(event, {
		password: rc.session.secret,
		name: loginFlowCookieName(event),
		maxAge: 600,
		cookie: cookieOptions(),
	})
}

/**
 * Read the session WITHOUT creating one: anonymous visitors must not receive
 * a session cookie (keeps public pages cacheable — spike carry-forward #5).
 * For an authenticated session this is also the single chokepoint that enforces
 * the absolute + idle expiry and slides the idle window on activity, so every
 * authenticated read path (proxy, SSR context, /auth/me) keeps the user active.
 * The idle-window touch re-seals with an unchanged payload size, so no
 * cookie-size re-assertion is needed there.
 */
export async function peekSession(event: H3Event) {
	if (!getCookie(event, sessionCookieName(event))) {
		return null
	}
	const session = await useRegistrySession(event)
	if (!session.data.user) {
		return null
	}

	const rc = useRuntimeConfig(event)
	const now = Date.now()
	const idleMs = rc.session.idleMaxAge * 1000
	const createdAt = session.data.createdAt ?? now
	const lastActivity = session.data.lastActivity ?? now
	if (isSessionExpired(now, createdAt, lastActivity, rc.session.maxAge * 1000, idleMs)) {
		await session.clear()
		return null
	}
	if (now - lastActivity > idleTouchThrottleMs(idleMs)) {
		await session.update({ lastActivity: now })
	}
	return session
}

/**
 * Same no-cookie-for-anonymous contract as peekSession, for the companion
 * id_token cookie. Deliberately NOT cleared when peekSession finds the main
 * session expired: the id_token is logout's only id_token_hint, and dropping it
 * there would leave /auth/logout unable to end the IdP's SSO session — the
 * user would be silently signed back in on the next "Sign in". It carries no
 * bearer capability of its own, so outliving the session is safe; logout clears
 * it on the way out.
 */
export async function peekIdTokenSession(event: H3Event) {
	if (!getCookie(event, idTokenCookieName(event))) {
		return null
	}
	return useIdTokenSession(event)
}

/**
 * Assert the sealed cookies this response is setting stay under the browser
 * ceiling — a silent drop would "log the user in" into a void.
 */
export function assertCookieSizes(event: H3Event) {
	const header = event.node.res.getHeader('set-cookie')
	const cookies = Array.isArray(header) ? header : header ? [String(header)] : []
	for (const cookie of cookies) {
		if (cookie.length > COOKIE_BYTE_LIMIT) {
			const name = cookie.split('=', 1)[0]
			throw createError({
				statusCode: 500,
				statusMessage: `Sealed cookie "${name}" is ${cookie.length} B > ${COOKIE_BYTE_LIMIT} B and would be dropped by the browser`,
			})
		}
	}
	return cookies.map(cookie => ({ name: cookie.split('=', 1)[0], bytes: cookie.length }))
}
