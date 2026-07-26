import { useSessionStore } from '@stores/session'

// B2 — the reusable write machinery for a project-scoped domain (create /
// state transitions / delete). Every call is CSRF-protected and reloads the
// keyed list; the can* flags gate the UI on the exact per-project authorities
// the backend enforces (_C / _U / _D). Pages supply the domain's base path,
// list key and permission prefix; only the create-form fields differ per
// domain.
export function useDomainWrite(options: {
	projectId: () => string
	basePath: () => string
	fetchKey: () => string
	permissionPrefix: string
}) {
	const sessionStore = useSessionStore()
	const { t } = useI18n()
	const registryMessage = useRegistryMessage()

	const canCreate = computed(() =>
		sessionStore.hasProjectAuthority(options.projectId(), `${options.permissionPrefix}_C`))
	const canUpdate = computed(() =>
		sessionStore.hasProjectAuthority(options.projectId(), `${options.permissionPrefix}_U`))
	const canDelete = computed(() =>
		sessionStore.hasProjectAuthority(options.projectId(), `${options.permissionPrefix}_D`))

	const headers = () => ({ 'x-csrf-token': sessionStore.csrf })
	const reload = () => refreshNuxtData(options.fetchKey())

	async function create(body: Record<string, unknown>): Promise<void> {
		await $fetch(options.basePath(), { method: 'POST', headers: headers(), body })
		await reload()
	}

	// Field edit (ADR 017 §3): PATCH the changed fields. Like create, it rethrows
	// so the form owns the inline error surface.
	async function update(id: string, body: Record<string, unknown>): Promise<void> {
		await $fetch(`${options.basePath()}/${id}`, { method: 'PATCH', headers: headers(), body })
		await reload()
	}

	// Any POST state transition: disable/enable, and domain verbs like an
	// alert's resolve/cancel/reopen. Unlike create (whose form owns an inline
	// error surface), transitions and deletes fire from a row menu / confirm
	// dialog with nowhere to show a message — so a rejected backend rule (e.g.
	// ALERT_DELETE_HAS_COMMUNICATION) is surfaced as a toast here.
	async function transition(id: string, action: string): Promise<void> {
		try {
			await $fetch(`${options.basePath()}/${id}/${action}`, { method: 'POST', headers: headers() })
			await reload()
		} catch (error) {
			registryMessage.error(apiErrorMessage(error, t))
		}
	}

	async function remove(id: string): Promise<void> {
		try {
			await $fetch(`${options.basePath()}/${id}`, { method: 'DELETE', headers: headers() })
			await reload()
		} catch (error) {
			registryMessage.error(apiErrorMessage(error, t))
		}
	}

	return { canCreate, canUpdate, canDelete, create, update, transition, remove, reload }
}
