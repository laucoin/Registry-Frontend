/**
 * Exposes the session-derived auth state and the validated public config to
 * the Vue app's SSR render (consumed by app/plugins/registry-context.server.ts).
 * peekSession guarantees anonymous page hits never receive a session cookie.
 *
 * The error screen is rendered through an internal /__nuxt_error request, which
 * is a page render like any other: it needs the config to reach the brand and
 * theme layers, and the session for the synchronizer token that its way out — a
 * sign-out — has to present. What it must not do is re-derive the profile, which
 * would replay the very refusal that produced it; the SSR bootstrap skips that
 * call once an error is already being rendered.
 */
export default defineEventHandler(async (event) => {
	const path = event.path
	if (
		path.startsWith('/api/')
		|| path.startsWith('/auth/')
		|| path.startsWith('/telemetry')
		|| path.startsWith('/_nuxt/')
		|| (path.startsWith('/__nuxt') && !path.startsWith('/__nuxt_error'))
		|| path.startsWith('/brand/')
		|| path === '/favicon.ico'
	) {
		return
	}

	const session = await peekSession(event)
	event.context.registryAuth = session
		? { user: session.data.user, csrf: session.data.csrf ?? '' }
		: null
	event.context.registryPublicConfig = getRegistryConfig()
})
