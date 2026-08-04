// Exposes the session-derived auth state and the validated public config to
// the Vue app's SSR render (consumed by app/plugins/registry-context.server.ts).
// peekSession guarantees anonymous page hits never receive a session cookie.
export default defineEventHandler(async (event) => {
	const path = event.path
	if (
		path.startsWith('/api/')
		|| path.startsWith('/auth/')
		|| path.startsWith('/telemetry')
		|| path.startsWith('/_nuxt/')
		|| path.startsWith('/__nuxt')
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
