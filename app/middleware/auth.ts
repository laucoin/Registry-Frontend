import { useSessionStore } from '@stores/session'

// ADR 022 — unauthenticated users go through the BFF login route (a full-page
// redirect to the IdP, not an in-app navigation).
export default defineNuxtRouteMiddleware((to) => {
	const sessionStore = useSessionStore()
	if (!sessionStore.authenticated) {
		return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`, { external: true })
	}
})
