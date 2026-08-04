import type { AppLanguage, ThemeMode } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface PersistedPreferences {
	themeMode?: ThemeMode
	language?: AppLanguage
}

// ADR 014 — reference store test shape: fresh Pinia per test, assert getters
// and actions through the store's public API.
describe('preferences store', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('defaults to SYSTEM mode following the system preference', () => {
		const store = usePreferencesStore()
		expect(store.themeMode).toBe('SYSTEM')
		expect(store.resolvedDark).toBe(false)

		store.setSystemPrefersDark(true)
		expect(store.resolvedDark).toBe(true)
	})

	it('explicit modes override the system preference', () => {
		const store = usePreferencesStore()
		store.setSystemPrefersDark(true)

		store.setThemeMode('LIGHT')
		expect(store.resolvedDark).toBe(false)

		store.setThemeMode('DARK')
		store.setSystemPrefersDark(false)
		expect(store.resolvedDark).toBe(true)
	})

	it('$reset restores factory state (reset-cascade contract)', () => {
		const store = usePreferencesStore()
		store.setThemeMode('DARK')
		store.setLanguage('en')

		store.$reset()
		expect(store.themeMode).toBe('SYSTEM')
		expect(store.language).toBe('fr')
	})

	// The update* orchestrators (ADR 014 amendment): set state AND persist to
	// the preferences cookie — only ever written on explicit user action.
	describe('update orchestrators', () => {
		function stubPreferencesCookie(initial?: PersistedPreferences) {
			const cookie = { value: initial }
			const useCookieMock = vi.fn(() => cookie)
			vi.stubGlobal('useCookie', useCookieMock)
			return { cookie, useCookieMock }
		}

		it.each<[ThemeMode]>([['LIGHT'], ['DARK'], ['SYSTEM']])(
			'updateThemeMode(%s) sets state and writes a fresh cookie',
			(mode) => {
				// Arrange — passive visitor: no cookie yet
				const { cookie, useCookieMock } = stubPreferencesCookie()
				const store = usePreferencesStore()

				// Act
				store.updateThemeMode(mode)

				// Assert
				expect(store.themeMode).toBe(mode)
				expect(cookie.value).toEqual({ themeMode: mode })
				expect(useCookieMock).toHaveBeenCalledWith('registry-preferences', {
					sameSite: 'lax',
					maxAge: 365 * 24 * 60 * 60,
				})
			},
		)

		it('updateThemeMode merges over an existing cookie without dropping the language', () => {
			// Arrange
			const { cookie } = stubPreferencesCookie({ themeMode: 'LIGHT', language: 'en' })
			const store = usePreferencesStore()

			// Act
			store.updateThemeMode('DARK')

			// Assert
			expect(cookie.value).toEqual({ themeMode: 'DARK', language: 'en' })
		})

		it.each<[AppLanguage]>([['en'], ['fr']])(
			'updateLanguage(%s) sets state, persists and switches the i18n locale',
			async (language) => {
				// Arrange
				const { cookie } = stubPreferencesCookie({ themeMode: 'DARK' })
				const setLocale = vi.fn().mockResolvedValue(undefined)
				vi.stubGlobal('useNuxtApp', vi.fn(() => ({ $i18n: { setLocale } })))
				const store = usePreferencesStore()

				// Act
				await store.updateLanguage(language)

				// Assert
				expect(store.language).toBe(language)
				expect(cookie.value).toEqual({ themeMode: 'DARK', language })
				expect(setLocale).toHaveBeenCalledWith(language)
			},
		)

		it('updateLanguage propagates an i18n failure after state and cookie are written', async () => {
			// Arrange
			const { cookie } = stubPreferencesCookie()
			const setLocale = vi.fn().mockRejectedValue(new Error('missing locale bundle'))
			vi.stubGlobal('useNuxtApp', vi.fn(() => ({ $i18n: { setLocale } })))
			const store = usePreferencesStore()

			// Act + Assert
			await expect(store.updateLanguage('en')).rejects.toThrow('missing locale bundle')
			expect(store.language).toBe('en')
			expect(cookie.value).toEqual({ language: 'en' })
		})
	})
})
