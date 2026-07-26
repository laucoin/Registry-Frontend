import type { PageDto, ProjectProfileRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'

/**
 * The dashboards spec — the caller's own project memberships, used to drive the favorite
 * (star) toggle wherever a project is shown (projects list, project overview).
 * Favorites live on the user's project-profile, not the project, so the star
 * needs the profile id — this composable resolves projectId → profile and
 * toggles via POST /users/profiles/{id}/favorite, then reloads the dashboards
 * that read the same data (this key + the home favorites panel).
 */
const PROFILES_KEY = 'user-profiles'

export function useUserProfiles() {
	const sessionStore = useSessionStore()
	const registryMessage = useRegistryMessage()

	const { data, status, refresh } = useFetch<PageDto<ProjectProfileRowDto>>('/api/v2/users/profiles', {
		key: PROFILES_KEY,
		query: { size: 200, sort: 'name' },
	})

	const profiles = computed(() => data.value?.content ?? [])

	function profileForProject(projectId: string): ProjectProfileRowDto | undefined {
		return profiles.value.find(profile => profile.project?.id === projectId)
	}

	function isFavorite(projectId: string): boolean {
		return profileForProject(projectId)?.favorite === true
	}

	async function toggleFavorite(projectId: string): Promise<void> {
		const profile = profileForProject(projectId)
		if (!profile) {
			return
		}
		try {
			await $fetch(`/api/v2/users/profiles/${profile.id}/favorite`, {
				method: 'POST',
				headers: { 'x-csrf-token': sessionStore.csrf },
			})
			await Promise.all([refreshNuxtData(PROFILES_KEY), refreshNuxtData('home-favorites')])
		} catch (error) {
			registryMessage.apiError(error)
		}
	}

	return { profiles, status, isFavorite, profileForProject, toggleFavorite, refresh }
}
