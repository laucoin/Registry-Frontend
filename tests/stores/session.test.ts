import type { ProjectDomain } from '@shared/utils/project-domains'
import type { SessionUser } from '@shared/utils/registry-config'
import { useSessionStore } from '@stores/session'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const USER: SessionUser = { sub: 'user-1', email: 'ada@example.org', name: 'Ada Lovelace' }

describe('session store', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	describe('session state', () => {
		it('starts unauthenticated and flips once a session is set', () => {
			// Arrange
			const store = useSessionStore()
			expect(store.authenticated).toBe(false)

			// Act
			store.setSession(USER, 'csrf-token')

			// Assert
			expect(store.authenticated).toBe(true)
			expect(store.user).toEqual(USER)
			expect(store.csrf).toBe('csrf-token')
		})

		it('clear resets the whole session (user, csrf, profile)', () => {
			// Arrange
			const store = useSessionStore()
			store.setSession(USER, 'csrf-token')
			store.setProfile({ value: 'ADMIN', label: 'Admin' }, ['REGISTRY_USER_R'])

			// Act
			store.clear()

			// Assert
			expect(store.authenticated).toBe(false)
			expect(store.csrf).toBe('')
			expect(store.role).toBeNull()
			expect(store.authorities).toEqual([])
		})
	})

	describe('authority gating', () => {
		it.each([
			['a granted authority', 'REGISTRY_USER_R', true],
			['a missing authority', 'REGISTRY_USER_C', false],
			['the empty string', '', false],
		])('hasAuthority handles %s → %s', (_label, authority, expected) => {
			// Arrange
			const store = useSessionStore()
			store.setProfile(null, ['REGISTRY_USER_R'])

			// Act + Assert
			expect(store.hasAuthority(authority)).toBe(expected)
		})

		it.each([
			['the granted project', 'p1', 'MOVEMENT_R', true],
			['another project (tenant isolation)', 'p2', 'MOVEMENT_R', false],
			['a missing permission on the granted project', 'p1', 'MOVEMENT_C', false],
		])('hasProjectAuthority handles %s → %s', (_label, projectId, permission, expected) => {
			// Arrange
			const store = useSessionStore()
			store.setProfile(null, ['p1_MOVEMENT_R'])

			// Act + Assert
			expect(store.hasProjectAuthority(projectId, permission)).toBe(expected)
		})
	})

	describe('canAccessProjectDomain', () => {
		const plainDomain: ProjectDomain = { key: 'movements', readPermission: 'MOVEMENT_R' }
		const optionDomain: ProjectDomain = {
			key: 'vehicles',
			readPermission: 'VEHICLE_R',
			optionPermission: 'OPTION_VEHICLE',
		}

		it.each([
			['a plain domain with its read authority', plainDomain, ['p1_MOVEMENT_R'], true],
			['a plain domain without its read authority', plainDomain, [], false],
			['an option domain with both gates', optionDomain, ['p1_OPTION_VEHICLE', 'p1_VEHICLE_R'], true],
			['an option domain missing the option gate', optionDomain, ['p1_VEHICLE_R'], false],
			['an option domain missing the read authority', optionDomain, ['p1_OPTION_VEHICLE'], false],
			['authorities granted on another project only', optionDomain, ['p2_OPTION_VEHICLE', 'p2_VEHICLE_R'], false],
		])('handles %s → %s', (_label, domain, authorities, expected) => {
			// Arrange
			const store = useSessionStore()
			store.setProfile(null, authorities)

			// Act + Assert — the exact conjunction the backend @PreAuthorize enforces
			expect(store.canAccessProjectDomain('p1', domain)).toBe(expected)
		})
	})

	describe('displayName', () => {
		it.each<[string, SessionUser | null, string]>([
			['no user', null, ''],
			['a full name claim', { sub: 's', name: 'Ada Lovelace', email: 'a@b.c' }, 'Ada Lovelace'],
			['given + family names', { sub: 's', givenName: 'Ada', familyName: 'Lovelace' }, 'Ada Lovelace'],
			['a given name only (no dangling space)', { sub: 's', givenName: 'Ada' }, 'Ada'],
			['an email fallback', { sub: 's', email: 'ada@example.org' }, 'ada@example.org'],
			['the bare subject as last resort', { sub: 'user-1' }, 'user-1'],
			['an empty name claim (falls through)', {
				sub: 's',
				name: '',
				email: 'ada@example.org'
			}, 'ada@example.org'],
		])('resolves %s → %j', (_label, user, expected) => {
			// Arrange
			const store = useSessionStore()
			if (user) {
				store.setSession(user, 'csrf-token')
			}

			// Act + Assert
			expect(store.displayName).toBe(expected)
		})
	})

	describe('refreshProfile', () => {
		it('stores the backend role and authorities', async () => {
			// Arrange
			const store = useSessionStore()
			const fetchMock = vi.fn().mockResolvedValue({
				id: 'user-1',
				role: { value: 'MANAGER', label: 'Manager' },
				authorities: ['p1_MOVEMENT_R'],
			})
			vi.stubGlobal('$fetch', fetchMock)

			// Act
			await store.refreshProfile()

			// Assert
			expect(fetchMock).toHaveBeenCalledWith('/api/v2/authentication/user/current')
			expect(store.role).toEqual({ value: 'MANAGER', label: 'Manager' })
			expect(store.authorities).toEqual(['p1_MOVEMENT_R'])
		})

		it('defaults a sparse payload to null role and no authorities', async () => {
			// Arrange
			const store = useSessionStore()
			store.setProfile({ value: 'ADMIN', label: 'Admin' }, ['OLD'])
			vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ id: 'user-1' }))

			// Act
			await store.refreshProfile()

			// Assert
			expect(store.role).toBeNull()
			expect(store.authorities).toEqual([])
		})

		it('propagates a backend failure and keeps the previous profile', async () => {
			// Arrange
			const store = useSessionStore()
			store.setProfile(null, ['KEPT'])
			vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('503')))

			// Act + Assert
			await expect(store.refreshProfile()).rejects.toThrow('503')
			expect(store.authorities).toEqual(['KEPT'])
		})
	})

	describe('auth orchestration', () => {
		it.each([
			['the default target', undefined, '/auth/login?redirect=%2F'],
			['a nested path with a query', '/projects/p1?tab=alerts', '/auth/login?redirect=%2Fprojects%2Fp1%3Ftab%3Dalerts'],
		])('login redirects externally into the BFF with %s', (_label, redirectTo, expected) => {
			// Arrange
			const store = useSessionStore()
			const navigateMock = vi.fn()
			vi.stubGlobal('navigateTo', navigateMock)

			// Act
			if (redirectTo === undefined) {
				store.login()
			} else {
				store.login(redirectTo)
			}

			// Assert
			expect(navigateMock).toHaveBeenCalledWith(expected, { external: true })
		})

		it('logout posts with the CSRF token, clears the session and leaves for the IdP', async () => {
			// Arrange
			const store = useSessionStore()
			store.setSession(USER, 'csrf-token')
			const fetchMock = vi.fn().mockResolvedValue({ redirectUrl: 'https://idp.example.org/logged-out' })
			vi.stubGlobal('$fetch', fetchMock)

			// Act
			await store.logout()

			// Assert
			expect(fetchMock).toHaveBeenCalledWith('/auth/logout', {
				method: 'POST',
				headers: { 'x-csrf-token': 'csrf-token' },
			})
			expect(store.authenticated).toBe(false)
			expect(window.location.href).toBe('https://idp.example.org/logged-out')
		})

		it('a failed logout propagates and keeps the session intact', async () => {
			// Arrange
			const store = useSessionStore()
			store.setSession(USER, 'csrf-token')
			vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('CSRF rejected')))

			// Act + Assert
			await expect(store.logout()).rejects.toThrow('CSRF rejected')
			expect(store.authenticated).toBe(true)
		})
	})
})
