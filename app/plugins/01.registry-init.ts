import type { CurrentUserDto } from '@shared/utils/api-types'
import type { AppLanguage, AuthInfo, RegistryConfig, ThemeMode } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { useSessionStore } from '@stores/session'
import { appendResponseHeader } from 'h3'

// Boot wiring, once per request/app:
//  - ADR 023: public config from the server context into the SSR payload
//  - ADR 022: session state from the sealed cookie into the session store
//  - B2: the session is enriched with the backend profile (role label +
//    authorities for UI gating) once per SSR render; the client hydrates it
//    from the Pinia payload, and a dead session (expired refresh) degrades to
//    the identity-only view rather than failing the whole render
//  - ADR 013: theme mode + language preferences (cookie-persisted) into the
//    preferences store, so the SSR paint has the right mode and locale — the
//    persisted cookie wins, the config default fills the gaps, and no cookie
//    default is set (visitors without the cookie must not be sent one);
//    SYSTEM mode resolves through the prefers-color-scheme hint cookie
//    maintained by theme-hint.client.ts
//  - ADR 015: the html lang attribute follows the active language; data-theme
//    on <html> is the hook for the global design layer (frosted surfaces,
//    shadows, focus rings), resolved before first paint so SSR matches —
//    AntD's own tokens still drive component internals (ADR 013)
export default defineNuxtPlugin(async (nuxtApp) => {
	const config = useRegistryConfigState()
	const nonce = useCspNonce()
	const sessionStore = useSessionStore()
	const preferencesStore = usePreferencesStore()

	if (import.meta.server) {
		const event = useRequestEvent()
		config.value = (event?.context.registryPublicConfig as RegistryConfig | null) ?? null
		nonce.value = (event?.context.nonce as string | undefined) ?? ''

		const auth = event?.context.registryAuth as AuthInfo | null | undefined
		if (auth?.user) {
			sessionStore.setSession(auth.user, auth.csrf)

			try {
				// .raw + set-cookie forwarding: the proxy may refresh (and the IdP
				// rotate) the tokens inside this Nitro sub-request, sealing them into
				// the sub-response's Set-Cookie. Without copying it onto the page
				// response the browser would keep the consumed refresh token and the
				// IdP's reuse detection would revoke the whole session.
				const response = await useRequestFetch().raw<CurrentUserDto>('/api/v2/authentication/user/current')
				if (event) {
					for (const cookie of response.headers.getSetCookie()) {
						appendResponseHeader(event, 'set-cookie', cookie)
					}
				}
				const me = response._data
				sessionStore.setProfile(me?.role ?? null, me?.authorities ?? [])
			} catch {
				sessionStore.setProfile(null, [])
			}
		}
	}

	const persisted = useCookie<{ themeMode?: ThemeMode, language?: AppLanguage } | undefined>('registry-preferences')
	if (persisted.value?.themeMode) {
		preferencesStore.setThemeMode(persisted.value.themeMode)
	}
	preferencesStore.setLanguage(persisted.value?.language ?? config.value?.defaultLanguage ?? 'fr')

	const systemDarkHint = useCookie<string>('registry-system-dark')
	preferencesStore.setSystemPrefersDark(systemDarkHint.value === '1')

	await nuxtApp.$i18n.setLocale(preferencesStore.language)

	useHead({
		htmlAttrs: {
			'lang': computed(() => preferencesStore.language),
			'data-theme': computed(() => (preferencesStore.resolvedDark ? 'dark' : 'light')),
		},
	})
})
