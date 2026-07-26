import type { Pinia } from 'pinia'
import type { AppLanguage, ThemeMode } from '@shared/utils/registry-config'
import { defineStore, getActivePinia } from 'pinia'
import type { Ref } from 'vue'

interface PersistedPreferences {
	themeMode?: ThemeMode
	language?: AppLanguage
}

const persistedByPinia = new WeakMap<Pinia, Ref<PersistedPreferences | undefined>>()

/**
 * The cookie is only ever written by the update* orchestrators (explicit user
 * actions), so passive visitors receive no cookie at all. Each preference is
 * merged over the other so a write never drops a value the reader did choose.
 *
 * ONE ref for the whole app, because `useCookie` seeds a fresh ref from the
 * cookie AS IT IS AT CALL TIME and flushes its own writes through a watcher: a
 * ref built per write reads a `document.cookie` the previous write has not
 * landed in yet, so two preferences changed within the same tick both merged
 * over the same stale base and the first choice was silently lost. Sharing the
 * ref makes the merge read what the previous action just wrote, and stops a
 * watcher accumulating per update.
 *
 * The active Pinia is the key: it is one object per app on the client and one
 * per request on the server (a module-level ref would be a cookie shared by
 * every concurrent SSR render). The store instance would be the more obvious
 * key and is NOT usable — in dev, Pinia's devtools plugin applies each action
 * through a freshly created tracking Proxy, so `this` is a different object on
 * every call.
 */
function persistedPreferences(): Ref<PersistedPreferences | undefined> {
	const pinia = getActivePinia()
	const cached = pinia && persistedByPinia.get(pinia)
	if (cached) {
		return cached
	}
	const persisted = useCookie<PersistedPreferences | undefined>('registry-preferences', {
		sameSite: 'lax',
		maxAge: 365 * 24 * 60 * 60,
	})
	if (pinia) {
		persistedByPinia.set(pinia, persisted)
	}
	return persisted
}

/**
 * Global store: user preferences, consumed directly by
 * components (no facade layer). Theme mode is the user
 * preference (SYSTEM/LIGHT/DARK); SYSTEM follows prefers-color-scheme, whose
 * last known value reaches the SSR render through a hint cookie.
 *
 * Convention: set* actions are PURE state setters, used by
 * SSR hydration (app/plugins/01.registry-init.ts) — they must stay
 * side-effect-free. update* actions are the user-facing orchestrators: they
 * set state AND persist / trigger side effects. Components call update*.
 */
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
