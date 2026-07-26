import { errorBody, isReauthRequired, SERVICE_UNAVAILABLE_CODE } from '@shared/utils/api-errors'
import type { CurrentUserDto } from '@shared/utils/api-types'
import { loginPath } from '@shared/utils/auth-routes'
import type { AppLanguage, AuthInfo, RegistryConfig, ThemeMode } from '@shared/utils/registry-config'
import { usePreferencesStore } from '@stores/preferences'
import { useSessionStore } from '@stores/session'
import { appendResponseHeader } from 'h3'
import type { FetchError } from 'ofetch'

/**
 * Boot wiring, once per request/app:
 *  - public config from the server context into the SSR payload
 *  - session state from the sealed cookie into the session store
 *  - B2: the session is enriched with the backend profile (role label +
 *    authorities for UI gating) once per SSR render; the client hydrates it
 *    from the Pinia payload, and a dead session (expired refresh) degrades to
 *    the identity-only view rather than failing the whole render
 *  - theme mode + language preferences (cookie-persisted) into the
 *    preferences store, so the SSR paint has the right mode and locale — the
 *    persisted cookie wins, the config default fills the gaps, and no cookie
 *    default is set (visitors without the cookie must not be sent one);
 *    SYSTEM mode resolves through the prefers-color-scheme hint cookie
 *    maintained by theme-hint.client.ts
 *  - the html lang attribute follows the active language; data-theme
 *    on <html> is the hook for the global design layer (frosted surfaces,
 *    shadows, focus rings), resolved before first paint so SSR matches —
 *    AntD's own tokens still drive component internals
 *
 * The SSR profile enrichment must use `$fetch.raw` with forwarded headers, not
 * useRequestFetch(): on the server the latter resolves to `event.$fetch`, which
 * carries no `.raw` and throws, leaving the session with zero authorities. Only
 * the cookie travels — the proxy sets Accept-Language from the app's own
 * preference, so forwarding the browser's would be overwritten anyway. The
 * sub-request's Set-Cookie is copied onto the page response because the proxy
 * may rotate the tokens inside it — dropping it would strand the browser on a
 * consumed refresh token and the IdP would revoke the whole session.
 *
 * The error screen renders through this same bootstrap, and there the identity
 * is wired up but the profile call is skipped: it is the call that failed, so
 * repeating it would only fail the failure page. The session still has to reach
 * the store, because signing out is the only way off a refusal screen and that
 * needs the synchronizer token.
 *
 * That same call is the single chokepoint where a dead or refused session is
 * discovered on the server, so it decides what the render becomes. Only one
 * failure is recoverable: the BFF's re-authentication signal (the refresh token
 * is really gone) is a full-page bounce to the IdP, which the client-only
 * interceptor cannot perform here. Everything else is blocking — a sign-in
 * refusal from Spring (unverified address, address already held, blocked
 * account), a backend that is down, any other rejection — because the profile it
 * failed to fetch is what gates the whole UI, and a page rendered without it can
 * only show a signed-in user a shell with nothing in it. So it fails the render
 * once and the user gets ONE global error screen naming the reason, rather than
 * an empty page whose every fetch raises the identical notice.
 */
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
		}
		if (auth?.user && !nuxtApp.payload.error) {
			try {
				const response = await $fetch.raw<CurrentUserDto>('/api/v2/authentication/user/current', {
					headers: useRequestHeaders(['cookie']),
				})
				if (event) {
					for (const cookie of response.headers.getSetCookie()) {
						appendResponseHeader(event, 'set-cookie', cookie)
					}
				}
				const me = response._data
				sessionStore.setProfile(me?.role ?? null, me?.authorities ?? [])
			} catch (error) {
				if (isReauthRequired(error)) {
					await navigateTo(loginPath(event?.path ?? '/'), { external: true, replace: true })
					return
				}
				const body = errorBody(error)
				throw createError({
					statusCode: body?.statusCode ?? (error as FetchError).statusCode ?? 503,
					statusMessage: body?.code ?? SERVICE_UNAVAILABLE_CODE,
					data: body ?? {},
					fatal: true,
				})
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
