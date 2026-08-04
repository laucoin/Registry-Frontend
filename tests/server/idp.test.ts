import type { H3Event } from 'h3'
import type { Mock } from 'vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'

// ADR 022 — the OIDC client seam, exercised with openid-client fully mocked
// (no network). The Nitro auto-imports (useRuntimeConfig, createError,
// getRequestURL, assertCookieSizes) resolve as globals at runtime and are
// stubbed the same way as in session.test.ts. The module memoizes discovery
// and coalesces refreshes in module state, so each test imports a fresh copy.

const { discovery, refreshTokenGrant, allowInsecureRequests, ResponseBodyError } = vi.hoisted(() => {
	// Mirror openid-client's error for an OAuth error response (e.g. invalid_grant),
	// the only failure that means the refresh token is genuinely dead.
	class ResponseBodyError extends Error {
	}

	return {
		discovery: vi.fn(),
		refreshTokenGrant: vi.fn(),
		allowInsecureRequests: vi.fn(),
		ResponseBodyError,
	}
})

vi.mock('openid-client', () => ({ discovery, refreshTokenGrant, allowInsecureRequests, ResponseBodyError }))

type IdpModule = typeof import('@server/utils/idp')
type RegistrySession = Parameters<IdpModule['refreshAccessToken']>[1]

interface SessionData {
	accessToken?: string
	refreshToken?: string
	expiresAt?: number
}

interface FakeSession {
	data: SessionData
	update: Mock
	clear: Mock
}

const NOW = 1_700_000_000_000
const FAKE_OIDC_CONFIG = { serverMetadata: () => ({}) }

function makeFakeSession(data: SessionData): FakeSession {
	return {
		data,
		update: vi.fn(async (patch: SessionData) => {
			Object.assign(data, patch)
		}),
		clear: vi.fn(async () => {
			for (const key of Object.keys(data)) {
				Reflect.deleteProperty(data, key)
			}
		}),
	}
}

function asSession(session: FakeSession): RegistrySession {
	return session as unknown as RegistrySession
}

function makeEvent(): H3Event {
	return { node: { res: { getHeader: () => undefined } } } as unknown as H3Event
}

function stubNitroGlobals(issuer = 'https://idp.example.com/realms/registry') {
	const assertCookieSizesMock = vi.fn(() => [])
	vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
		idp: { issuer, clientId: 'registry-frontend', clientSecret: 'shhh' },
	})))
	vi.stubGlobal('createError', (input: { statusCode: number, statusMessage: string }) =>
		Object.assign(new Error(input.statusMessage), input))
	vi.stubGlobal('assertCookieSizes', assertCookieSizesMock)
	vi.stubGlobal('getRequestURL', vi.fn(() => new URL('https://registry.example.com/projects/42?tab=members')))
	return { assertCookieSizesMock }
}

async function loadModule(): Promise<IdpModule> {
	vi.resetModules()
	return await import('@server/utils/idp')
}

afterEach(() => {
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
	discovery.mockReset()
	refreshTokenGrant.mockReset()
})

describe('getIdpConfiguration', () => {
	it('memoizes discovery: concurrent and repeated calls share one network attempt', async () => {
		stubNitroGlobals()
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		const idp = await loadModule()

		const first = idp.getIdpConfiguration()
		const second = idp.getIdpConfiguration()
		await first
		const third = await idp.getIdpConfiguration()

		expect(second).toBe(first)
		expect(third).toBe(FAKE_OIDC_CONFIG)
		expect(discovery).toHaveBeenCalledTimes(1)
	})

	it('resets the memo on failure so a later call retries once the IdP is back', async () => {
		stubNitroGlobals()
		discovery.mockRejectedValueOnce(new Error('idp down')).mockResolvedValueOnce(FAKE_OIDC_CONFIG)
		const idp = await loadModule()

		await expect(idp.getIdpConfiguration()).rejects.toThrow('idp down')
		const recovered = await idp.getIdpConfiguration()

		expect(recovered).toBe(FAKE_OIDC_CONFIG)
		expect(discovery).toHaveBeenCalledTimes(2)
	})

	it.each([
		['an http issuer opts into allowInsecureRequests', 'http://localhost:8080/realms/registry', { execute: [allowInsecureRequests] }],
		['an https issuer stays strict', 'https://idp.example.com/realms/registry', undefined],
	])('%s', async (_label, issuer, expectedOptions) => {
		stubNitroGlobals(issuer)
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		const idp = await loadModule()

		await idp.getIdpConfiguration()

		expect(discovery).toHaveBeenCalledWith(
			new URL(issuer),
			'registry-frontend',
			'shhh',
			undefined,
			expectedOptions,
		)
	})
})

describe('refreshAccessToken', () => {
	it('clears the session and returns false when no refresh token is stored', async () => {
		stubNitroGlobals()
		const session = makeFakeSession({ accessToken: 'stale' })
		const idp = await loadModule()

		const refreshed = await idp.refreshAccessToken(makeEvent(), asSession(session))

		expect(refreshed).toBe(false)
		expect(session.clear).toHaveBeenCalledTimes(1)
		expect(refreshTokenGrant).not.toHaveBeenCalled()
	})

	it('stores the rotated tokens, re-asserts cookie sizes and returns true on success', async () => {
		const { assertCookieSizesMock } = stubNitroGlobals()
		vi.spyOn(Date, 'now').mockReturnValue(NOW)
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		refreshTokenGrant.mockResolvedValue({ access_token: 'new-at', refresh_token: 'new-rt', expires_in: 120 })
		const session = makeFakeSession({ refreshToken: 'old-rt' })
		const idp = await loadModule()

		const refreshed = await idp.refreshAccessToken(makeEvent(), asSession(session))

		expect(refreshed).toBe(true)
		expect(refreshTokenGrant).toHaveBeenCalledWith(FAKE_OIDC_CONFIG, 'old-rt')
		expect(session.update).toHaveBeenCalledWith({
			accessToken: 'new-at',
			refreshToken: 'new-rt',
			expiresAt: NOW + 120 * 1000,
		})
		expect(assertCookieSizesMock).toHaveBeenCalledTimes(1)
	})

	it('keeps the previous refresh token and defaults expiry when the IdP omits them', async () => {
		stubNitroGlobals()
		vi.spyOn(Date, 'now').mockReturnValue(NOW)
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		refreshTokenGrant.mockResolvedValue({ access_token: 'new-at' })
		const session = makeFakeSession({ refreshToken: 'old-rt' })
		const idp = await loadModule()

		const refreshed = await idp.refreshAccessToken(makeEvent(), asSession(session))

		expect(refreshed).toBe(true)
		expect(session.update).toHaveBeenCalledWith({
			accessToken: 'new-at',
			refreshToken: 'old-rt',
			expiresAt: NOW + 300 * 1000,
		})
	})

	it('clears the session and returns false when the IdP rejects the grant', async () => {
		stubNitroGlobals()
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		refreshTokenGrant.mockRejectedValue(new ResponseBodyError('invalid_grant'))
		const session = makeFakeSession({ refreshToken: 'revoked-rt' })
		const idp = await loadModule()

		const refreshed = await idp.refreshAccessToken(makeEvent(), asSession(session))

		expect(refreshed).toBe(false)
		expect(session.clear).toHaveBeenCalledTimes(1)
	})

	it('keeps the session and rethrows on a transient IdP/network failure (not a dead token)', async () => {
		stubNitroGlobals()
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		// A network error reaching the IdP is a plain TypeError with no statusCode
		// and is not a ResponseBodyError — the refresh token is still valid.
		const networkError = new TypeError('fetch failed')
		refreshTokenGrant.mockRejectedValue(networkError)
		const session = makeFakeSession({ refreshToken: 'live-rt' })
		const idp = await loadModule()

		await expect(idp.refreshAccessToken(makeEvent(), asSession(session))).rejects.toBe(networkError)
		expect(session.clear).not.toHaveBeenCalled()
	})

	it('propagates an error carrying a statusCode instead of masking it as a refresh failure', async () => {
		stubNitroGlobals()
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		const cookieError = Object.assign(new Error('cookie too large'), { statusCode: 500 })
		refreshTokenGrant.mockRejectedValue(cookieError)
		const session = makeFakeSession({ refreshToken: 'old-rt' })
		const idp = await loadModule()

		await expect(idp.refreshAccessToken(makeEvent(), asSession(session))).rejects.toBe(cookieError)
		expect(session.clear).not.toHaveBeenCalled()
	})

	it('coalesces concurrent refreshes of the same token into a single grant', async () => {
		stubNitroGlobals()
		vi.spyOn(Date, 'now').mockReturnValue(NOW)
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		let resolveGrant: (tokens: unknown) => void = () => {
		}
		refreshTokenGrant.mockReturnValue(new Promise((resolve) => {
			resolveGrant = resolve
		}))
		const sessionA = makeFakeSession({ refreshToken: 'shared-rt' })
		const sessionB = makeFakeSession({ refreshToken: 'shared-rt' })
		const idp = await loadModule()

		const firstCall = idp.refreshAccessToken(makeEvent(), asSession(sessionA))
		const secondCall = idp.refreshAccessToken(makeEvent(), asSession(sessionB))
		resolveGrant({ access_token: 'new-at', refresh_token: 'new-rt', expires_in: 60 })

		await expect(firstCall).resolves.toBe(true)
		await expect(secondCall).resolves.toBe(true)
		expect(refreshTokenGrant).toHaveBeenCalledTimes(1)
		expect(sessionA.data.refreshToken).toBe('new-rt')
		expect(sessionB.data.refreshToken).toBe('new-rt')
	})

	it('never reuses a settled grant: a later refresh runs a fresh grant', async () => {
		stubNitroGlobals()
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		refreshTokenGrant.mockResolvedValue({ access_token: 'at', refresh_token: 'rt-2', expires_in: 60 })
		const session = makeFakeSession({ refreshToken: 'rt-1' })
		const idp = await loadModule()

		await idp.refreshAccessToken(makeEvent(), asSession(session))
		// Let the in-flight map's settle-cleanup microtasks run.
		await Promise.resolve()
		await Promise.resolve()
		await idp.refreshAccessToken(makeEvent(), asSession(session))

		expect(refreshTokenGrant).toHaveBeenCalledTimes(2)
		expect(refreshTokenGrant).toHaveBeenLastCalledWith(FAKE_OIDC_CONFIG, 'rt-2')
	})
})

describe('ensureFreshAccessToken', () => {
	it.each([
		['no expiry is stored (nothing to renew)', undefined],
		['the token is still comfortably fresh', NOW + 5 * 60 * 1000],
	])('does nothing when %s', async (_label, expiresAt) => {
		stubNitroGlobals()
		vi.spyOn(Date, 'now').mockReturnValue(NOW)
		const session = makeFakeSession({ refreshToken: 'rt', expiresAt })
		const idp = await loadModule()

		await idp.ensureFreshAccessToken(makeEvent(), asSession(session))

		expect(refreshTokenGrant).not.toHaveBeenCalled()
	})

	it('refreshes proactively inside the 30 s expiry skew', async () => {
		stubNitroGlobals()
		vi.spyOn(Date, 'now').mockReturnValue(NOW)
		discovery.mockResolvedValue(FAKE_OIDC_CONFIG)
		refreshTokenGrant.mockResolvedValue({ access_token: 'new-at', refresh_token: 'new-rt', expires_in: 60 })
		const session = makeFakeSession({ refreshToken: 'rt', expiresAt: NOW + 10_000 })
		const idp = await loadModule()

		await idp.ensureFreshAccessToken(makeEvent(), asSession(session))

		expect(refreshTokenGrant).toHaveBeenCalledTimes(1)
		expect(session.data.accessToken).toBe('new-at')
	})

	it('throws a 401 when the session cannot be refreshed (re-login required)', async () => {
		stubNitroGlobals()
		vi.spyOn(Date, 'now').mockReturnValue(NOW)
		const session = makeFakeSession({ expiresAt: NOW - 1000 })
		const idp = await loadModule()

		await expect(idp.ensureFreshAccessToken(makeEvent(), asSession(session)))
			.rejects.toMatchObject({ statusCode: 401, message: 'Session expired' })
	})
})

describe('callbackUrl', () => {
	it('builds /auth/callback on the request origin, dropping path and query', async () => {
		stubNitroGlobals()
		const idp = await loadModule()

		expect(idp.callbackUrl(makeEvent())).toBe('https://registry.example.com/auth/callback')
	})
})

describe('isIdpReachable', () => {
	it.each([
		['a 200 discovery document', { ok: true }, true],
		['a non-2xx response', { ok: false }, false],
	])('probes the well-known endpoint and handles %s', async (_label, response, expected) => {
		stubNitroGlobals()
		vi.stubGlobal('fetch', vi.fn(async () => response))
		const idp = await loadModule()

		await expect(idp.isIdpReachable()).resolves.toBe(expected)
	})

	it('returns false when the probe throws (connection refused / timeout)', async () => {
		stubNitroGlobals()
		vi.stubGlobal('fetch', vi.fn(async () => {
			throw new Error('ECONNREFUSED')
		}))
		const idp = await loadModule()

		await expect(idp.isIdpReachable()).resolves.toBe(false)
	})

	it.each([
		['without a trailing slash', 'https://idp.example.com/realms/registry'],
		['with a trailing slash', 'https://idp.example.com/realms/registry/'],
	])('targets the issuer\'s .well-known document %s', async (_label, issuer) => {
		stubNitroGlobals(issuer)
		const fetchMock = vi.fn(async () => ({ ok: true }))
		vi.stubGlobal('fetch', fetchMock)
		const idp = await loadModule()

		await idp.isIdpReachable()

		const [target] = fetchMock.mock.calls[0] as unknown as [URL]
		expect(target.href).toBe('https://idp.example.com/realms/registry/.well-known/openid-configuration')
	})
})
