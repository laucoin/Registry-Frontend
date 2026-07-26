import { usePreferencesStore } from '@stores/preferences'

/**
 * SYSTEM theme mode follows prefers-color-scheme. The current value
 * feeds the store (live switching) and a hint cookie (so the *next* SSR paint
 * resolves SYSTEM correctly instead of defaulting to light).
 */
export default defineNuxtPlugin(() => {
	const preferencesStore = usePreferencesStore()
	const hint = useCookie<string>('registry-system-dark', {
		sameSite: 'lax',
		maxAge: 365 * 24 * 60 * 60,
	})

	const media = window.matchMedia('(prefers-color-scheme: dark)')

	function apply(prefersDark: boolean): void {
		preferencesStore.setSystemPrefersDark(prefersDark)
		hint.value = prefersDark ? '1' : '0'
	}

	apply(media.matches)
	media.addEventListener('change', event => apply(event.matches))
})
