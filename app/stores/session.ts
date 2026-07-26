import type { CurrentUserDto, LabelDto } from '@shared/utils/api-types'
import { loginPath } from '@shared/utils/auth-routes'
import type { ProjectDomain } from '@shared/utils/project-domains'
import type { SessionUser } from '@shared/utils/registry-config'
import { defineStore } from 'pinia'

/**
 * Global store: auth/current session, consumed directly
 * by components. Auth orchestration lives in the actions: components
 * never call /auth/* or touch navigation for auth themselves.
 * State uses the factory form so every SSR request gets a fresh object.
 * `role`/`authorities` hold the backend profile (API v2 current-user): the
 * role label for display and the authorities the UI mirrors for gating —
 * frontend guards mirror backend authorities, never replace them.
 */
export const useSessionStore = defineStore('session', {
	state: () => ({
		user: null as SessionUser | null,
		csrf: '',
		role: null as LabelDto | null,
		authorities: [] as string[],
	}),
	getters: {
		authenticated: state => state.user !== null,
		hasAuthority: state => (authority: string): boolean => state.authorities.includes(authority),
		/**
		 * Project-scoped authority: the namespaced `{projectId}_PERM`
		 * string is the tenant-isolation mechanism; the UI mirrors it, the
		 * backend still enforces it.
		 */
		hasProjectAuthority: state => (projectId: string, permission: string): boolean =>
			state.authorities.includes(`${projectId}_${permission}`),
		/**
		 * Access to a project-scoped domain: its read authority AND, for
		 * option-modules, the project-option gate — the exact conjunction the
		 * backend @PreAuthorize enforces.
		 */
		canAccessProjectDomain() {
			return (projectId: string, domain: ProjectDomain): boolean => {
				if (domain.optionPermission
					&& !this.hasProjectAuthority(projectId, domain.optionPermission)) {
					return false
				}
				return this.hasProjectAuthority(projectId, domain.readPermission)
			}
		},
		displayName: (state) => {
			if (!state.user) {
				return ''
			}
			return state.user.name
				|| [state.user.givenName, state.user.familyName].filter(Boolean).join(' ')
				|| state.user.email
				|| state.user.sub
		},
	},
	actions: {
		setSession(user: SessionUser, csrf: string): void {
			this.user = user
			this.csrf = csrf
		},
		setProfile(role: LabelDto | null, authorities: string[]): void {
			this.role = role
			this.authorities = authorities
		},
		/**
		 * Re-derive the profile from the backend after an authority-changing
		 * action (creating/entering a project grants new project-scoped
		 * authorities). Client-side; SSR hydration already covers first load.
		 */
		async refreshProfile(): Promise<void> {
			const me = await $fetch<CurrentUserDto>('/api/v2/authentication/user/current')
			this.setProfile(me.role ?? null, me.authorities ?? [])
		},
		clear(): void {
			this.$reset()
		},
		/**
		 * Full-page redirect into the BFF login route — not an
		 * in-app navigation. Callers pass the path to return to.
		 */
		login(redirectTo = '/'): void {
			navigateTo(loginPath(redirectTo), { external: true })
		},
		async logout(): Promise<void> {
			const { redirectUrl } = await $fetch('/auth/logout', {
				method: 'POST',
				headers: { 'x-csrf-token': this.csrf },
			})
			this.clear()
			window.location.href = redirectUrl
		},
	},
})
