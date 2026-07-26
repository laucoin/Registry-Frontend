import type { RegistrySessionData } from '@server/utils/session'
import {
	assertCookieSizes,
	COOKIE_BYTE_LIMIT,
	idTokenCookieName,
	isSessionExpired,
	peekIdTokenSession,
	peekSession,
	sessionCookieName,
	useIdTokenSession,
	useLoginFlowSession,
	useRegistrySession,
} from '@server/utils/session'
import type { H3Event } from 'h3'
import type { Mock } from 'vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * Sealed-cookie session handling. The h3/Nitro helpers
 * (useRuntimeConfig, useSession, getCookie, createError) are Nitro auto-imports
 * resolved as globals at runtime, so the tests stub them with vi.stubGlobal and
 * drive the module against fake H3 events.
 */

const SECRET = 'unit-test-session-secret-0123456789abcdef'
const MAX_AGE_S = 8 * 60 * 60
const IDLE_MAX_AGE_S = 30 * 60

interface FakeSession {
	data: RegistrySessionData
	update: Mock
	clear: Mock
}

function makeFakeSession(data: RegistrySessionData): FakeSession {
	return {
		data,
		update: vi.fn(async (patch: Partial<RegistrySessionData>) => {
			Object.assign(data, patch)
		}),
		clear: vi.fn(async () => {
			for (const key of Object.keys(data)) {
				Reflect.deleteProperty(data, key)
			}
		}),
	}
}

function makeEvent(setCookieHeader?: string | string[] | number): H3Event {
	return {
		node: { res: { getHeader: () => setCookieHeader } },
	} as unknown as H3Event
}

function stubNitroGlobals(options: {
	production?: boolean
	cookies?: Record<string, string>
	session?: FakeSession
	idleMaxAge?: number
} = {}) {
	const runtimeConfig = {
		production: options.production ?? false,
		session: {
			secret: SECRET,
			maxAge: MAX_AGE_S,
			idleMaxAge: options.idleMaxAge ?? IDLE_MAX_AGE_S,
		},
	}
	const useSessionMock = vi.fn(async (_event: H3Event, _config: Record<string, unknown>) =>
		options.session ?? makeFakeSession({}))
	vi.stubGlobal('useRuntimeConfig', vi.fn(() => runtimeConfig))
	vi.stubGlobal('useSession', useSessionMock)
	vi.stubGlobal('getCookie', vi.fn((_event: H3Event, name: string) => options.cookies?.[name]))
	vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) =>
		Object.assign(new Error(input.statusMessage), input))
	return { useSessionMock }
}

afterEach(() => {
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

/**
 * The two-tier session lifetime: an absolute cap from login and a
 * sliding idle-timeout. This is the security-relevant decision, so it carries
 * its own coverage independent of the h3 session plumbing.
 */
describe('isSessionExpired', () => {
	const ABSOLUTE = 8 * 60 * 60 * 1000
	const IDLE = 30 * 60 * 1000
	const now = 10_000_000_000

	it.each([
		['a fresh, just-active session', now, now, false],
		['a session within both windows', now - 2 * 60 * 60 * 1000, now - 5 * 60 * 1000, false],
		['idle exceeded even when the absolute cap is far off', now - 1 * 60 * 60 * 1000, now - 31 * 60 * 1000, true],
		['the absolute cap exceeded even while active', now - (8 * 60 * 60 * 1000 + 1), now - 60 * 1000, true],
		['the exact boundaries (strictly greater expires)', now - ABSOLUTE, now - IDLE, false],
		['both windows exceeded at once', now - 9 * 60 * 60 * 1000, now - 31 * 60 * 1000, true],
	])('handles %s', (_label, createdAt, lastActivity, expired) => {
		expect(isSessionExpired(now, createdAt, lastActivity, ABSOLUTE, IDLE)).toBe(expired)
	})
})

/**
 * __Host- prefix in production (https), plain names over local http.
 */
describe('cookie names', () => {
	it.each([
		[true, '__Host-registry-session', '__Host-registry-session-idt'],
		[false, 'registry-session', 'registry-session-idt'],
	])('production=%s picks the right session and id-token cookie names', (production, sessionName, idtName) => {
		stubNitroGlobals({ production })
		const event = makeEvent()

		expect(sessionCookieName(event)).toBe(sessionName)
		expect(idTokenCookieName(event)).toBe(idtName)
	})
})

describe('session factories', () => {
	it.each([
		['useRegistrySession', useRegistrySession, 'registry-session', MAX_AGE_S],
		['useIdTokenSession', useIdTokenSession, 'registry-session-idt', MAX_AGE_S],
		['useLoginFlowSession', useLoginFlowSession, 'registry-login-flow', 600],
	])('%s seals under the expected name, lifetime and hardened cookie options', async (_label, factory, name, maxAge) => {
		const { useSessionMock } = stubNitroGlobals()
		const event = makeEvent()

		await factory(event)

		expect(useSessionMock).toHaveBeenCalledTimes(1)
		expect(useSessionMock.mock.calls[0]![1]).toMatchObject({
			password: SECRET,
			name,
			maxAge,
			cookie: { httpOnly: true, secure: true, sameSite: 'lax', path: '/' },
		})
	})

	it.each([
		['useRegistrySession', useRegistrySession, '__Host-registry-session'],
		['useIdTokenSession', useIdTokenSession, '__Host-registry-session-idt'],
		['useLoginFlowSession', useLoginFlowSession, '__Host-registry-login-flow'],
	])('%s switches to the __Host- name in production', async (_label, factory, name) => {
		const { useSessionMock } = stubNitroGlobals({ production: true })
		const event = makeEvent()

		await factory(event)

		expect(useSessionMock.mock.calls[0]![1]).toMatchObject({ name })
	})
})

describe('peekSession', () => {
	const NOW = 1_700_000_000_000
	const user = { sub: 'user-1' }

	function freezeNow() {
		vi.spyOn(Date, 'now').mockReturnValue(NOW)
	}

	it('returns null for an anonymous visitor without ever minting a session cookie', async () => {
		const { useSessionMock } = stubNitroGlobals({ cookies: {} })
		const event = makeEvent()

		const result = await peekSession(event)

		expect(result).toBeNull()
		expect(useSessionMock).not.toHaveBeenCalled()
	})

	it('returns null when the cookie fails to unseal (tampered → empty data, no user)', async () => {
		const session = makeFakeSession({})
		stubNitroGlobals({ cookies: { 'registry-session': 'tampered-seal' }, session })
		const event = makeEvent()

		const result = await peekSession(event)

		expect(result).toBeNull()
		expect(session.clear).not.toHaveBeenCalled()
	})

	it.each([
		['absolute cap exceeded', NOW - (MAX_AGE_S * 1000 + 1), NOW],
		['idle window exceeded', NOW - 1000, NOW - (IDLE_MAX_AGE_S * 1000 + 1)],
	])('clears and returns null when the %s', async (_label, createdAt, lastActivity) => {
		freezeNow()
		const session = makeFakeSession({ user, createdAt, lastActivity })
		stubNitroGlobals({ cookies: { 'registry-session': 'sealed' }, session })
		const event = makeEvent()

		const result = await peekSession(event)

		expect(result).toBeNull()
		expect(session.clear).toHaveBeenCalledTimes(1)
	})

	it('returns the live session without re-sealing when activity is inside the touch throttle', async () => {
		freezeNow()
		const session = makeFakeSession({ user, createdAt: NOW - 1000, lastActivity: NOW - 30_000 })
		stubNitroGlobals({ cookies: { 'registry-session': 'sealed' }, session })
		const event = makeEvent()

		const result = await peekSession(event)

		expect(result).toBe(session)
		expect(session.update).not.toHaveBeenCalled()
	})

	it('slides the idle window once activity is older than the touch throttle', async () => {
		freezeNow()
		const session = makeFakeSession({ user, createdAt: NOW - 1000, lastActivity: NOW - 61_000 })
		stubNitroGlobals({ cookies: { 'registry-session': 'sealed' }, session })
		const event = makeEvent()

		const result = await peekSession(event)

		expect(result).toBe(session)
		expect(session.update).toHaveBeenCalledWith({ lastActivity: NOW })
	})

	it('caps the touch throttle at half the idle window so short idle windows still refresh', async () => {
		freezeNow()
		const session = makeFakeSession({ user, createdAt: NOW - 1000, lastActivity: NOW - 41_000 })
		stubNitroGlobals({ cookies: { 'registry-session': 'sealed' }, session, idleMaxAge: 80 })
		const event = makeEvent()

		const result = await peekSession(event)

		expect(result).toBe(session)
		expect(session.update).toHaveBeenCalledWith({ lastActivity: NOW })
	})

	it('treats missing createdAt/lastActivity as a fresh session (legacy payloads stay valid)', async () => {
		freezeNow()
		const session = makeFakeSession({ user })
		stubNitroGlobals({ cookies: { 'registry-session': 'sealed' }, session })
		const event = makeEvent()

		const result = await peekSession(event)

		expect(result).toBe(session)
		expect(session.clear).not.toHaveBeenCalled()
		expect(session.update).not.toHaveBeenCalled()
	})
})

/**
 * The id_token cookie outlives an expired session on purpose — it is logout's
 * only id_token_hint — so reading it must not mint one for an anonymous
 * visitor, and must still hand it over once the main session is gone.
 */
describe('peekIdTokenSession', () => {
	it('returns null for a visitor without the companion cookie, minting nothing', async () => {
		const { useSessionMock } = stubNitroGlobals({ cookies: {} })
		const event = makeEvent()

		const result = await peekIdTokenSession(event)

		expect(result).toBeNull()
		expect(useSessionMock).not.toHaveBeenCalled()
	})

	it('returns the id-token session when the cookie is present but the main session is gone', async () => {
		const session = makeFakeSession({})
		stubNitroGlobals({ cookies: { 'registry-session-idt': 'sealed' }, session })
		const event = makeEvent()

		const result = await peekIdTokenSession(event)

		expect(result).toBe(session)
	})

	it('reads the __Host- prefixed cookie in production', async () => {
		const session = makeFakeSession({})
		stubNitroGlobals({ production: true, cookies: { 'registry-session-idt': 'sealed' }, session })
		const event = makeEvent()

		expect(await peekIdTokenSession(event)).toBeNull()
	})
})

describe('assertCookieSizes', () => {
	it.each([
		['no set-cookie header', undefined, []],
		['a single string header', 'a=b', [{ name: 'a', bytes: 3 }]],
		['a non-array scalar header', 42, [{ name: '42', bytes: 2 }]],
		[
			'an array of headers',
			['session=abc; Path=/', 'idt=x'],
			[{ name: 'session', bytes: 19 }, { name: 'idt', bytes: 5 }],
		],
	])('reports %s within the limit', (_label, header, expected) => {
		stubNitroGlobals()
		const event = makeEvent(header as string | string[] | undefined)

		expect(assertCookieSizes(event)).toEqual(expected)
	})

	it('accepts a cookie exactly at the browser ceiling', () => {
		stubNitroGlobals()
		const cookie = `big=${'x'.repeat(COOKIE_BYTE_LIMIT - 4)}`
		const event = makeEvent([cookie])

		expect(assertCookieSizes(event)).toEqual([{ name: 'big', bytes: COOKIE_BYTE_LIMIT }])
	})

	it.each([
		['a single oversized cookie', [`big=${'x'.repeat(COOKIE_BYTE_LIMIT)}`]],
		['an oversized cookie hiding among valid ones', ['ok=1', `big=${'x'.repeat(COOKIE_BYTE_LIMIT)}`]],
	])('throws a 500 naming the cookie for %s (a silent browser drop is a hard error)', (_label, header) => {
		stubNitroGlobals()
		const event = makeEvent(header)

		let caught: unknown
		try {
			assertCookieSizes(event)
		} catch (error) {
			caught = error
		}

		expect(caught).toBeInstanceOf(Error)
		expect(caught).toMatchObject({ statusCode: 500 })
		expect((caught as Error).message).toContain('"big"')
	})
})
