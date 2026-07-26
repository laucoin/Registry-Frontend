import { projectDomainByKey } from '@shared/utils/project-domains'
import { useSessionStore } from '@stores/session'

// B2 — guards project-scoped domain pages against the same read + option gate
// the backend enforces (single-sourced from PROJECT_DOMAINS). Missing access
// is a 403; the backend re-checks regardless.
export default defineNuxtRouteMiddleware((to) => {
	const sessionStore = useSessionStore()
	const projectId = to.params.id as string
	const domain = projectDomainByKey(to.path.split('/')[3] ?? '')

	if (domain && !sessionStore.canAccessProjectDomain(projectId, domain)) {
		throw createError({ statusCode: 403 })
	}
})
