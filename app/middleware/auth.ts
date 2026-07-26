import { loginPath } from '@shared/utils/auth-routes'
import { useSessionStore } from '@stores/session'

/**
 * Unauthenticated users go through the BFF login route (a full-page
 * redirect to the IdP, not an in-app navigation).
 *
 * A denial raised by a later middleware (project-authority's 403) makes Nuxt
 * re-render the route to paint the error page, and this middleware runs again
 * on that second pass — with a session store that has not been repopulated, so
 * it reads as unauthenticated. Redirecting then would turn every legitimate
 * refusal into an infinite sign-in bounce instead of showing the 403, so an
 * error already in flight short-circuits before the session is consulted.
 */
export default defineNuxtRouteMiddleware((to) => {
	if (useError().value) {
		return
	}

	const sessionStore = useSessionStore()
	if (!sessionStore.authenticated) {
		return navigateTo(loginPath(to.fullPath), { external: true })
	}
})
