import type { AppLanguage, ThemeMode } from '@shared/utils/registry-config'
import { defineStore } from 'pinia'

interface PersistedPreferences {
	themeMode?: ThemeMode
	language?: AppLanguage
}

// The cookie is only ever written by the update* orchestrators (explicit user
// actions), so passive visitors receive no cookie at all.
function persistedPreferences() {
	return useCookie<PersistedPreferences | undefined>('registry-preferences', {
		sameSite: 'lax',
		maxAge: 365 * 24 * 60 * 60,
	})
}

// ADR 013/014 — global store: user preferences, consumed directly by
// components (ADR 014 as amended — no facade layer). Theme mode is the user
// preference (SYSTEM/LIGHT/DARK); SYSTEM follows prefers-color-scheme, whose
// last known value reaches the SSR render through a hint cookie.
//
// Convention (ADR 014 amendment): set* actions are PURE state setters, used by
// SSR hydration (app/plugins/01.registry-init.ts) — they must stay
// side-effect-free. update* actions are the user-facing orchestrators: they
// set state AND persist / trigger side effects. Components call update*.
export const usePreferencesStore = defineStore('preferences', {
	state: () => ({
		themeMode: 'SYSTEM' as ThemeMode,
		language: 'fr' as AppLanguage,
		systemPrefersDark: false,
	}),
	getters: {
		resolvedDark: (state): boolean =>
			state.themeMode === 'DARK' || (state.themeMode === 'SYSTEM' && state.systemPrefersDark),
	},
	actions: {
		setThemeMode(mode: ThemeMode): void {
			this.themeMode = mode
		},
		setLanguage(language: AppLanguage): void {
			this.language = language
		},
		setSystemPrefersDark(prefersDark: boolean): void {
			this.systemPrefersDark = prefersDark
		},
		updateThemeMode(mode: ThemeMode): void {
			this.setThemeMode(mode)
			const persisted = persistedPreferences()
			persisted.value = { ...persisted.value, themeMode: mode }
		},
		async updateLanguage(language: AppLanguage): Promise<void> {
			this.setLanguage(language)
			const persisted = persistedPreferences()
			persisted.value = { ...persisted.value, language }
			await useNuxtApp().$i18n.setLocale(language)
		},
	},
})
