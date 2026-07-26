import type { PageDto, ProjectProfileRowDto } from '@shared/utils/api-types'
import { useSessionStore } from '@stores/session'
import { message } from 'ant-design-vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { computed, ref, type Ref } from 'vue'
import { useUserProfiles } from '../../app/composables/useUserProfiles'
import { apiErrorMessage } from '../../app/utils/apiError'

vi.mock('ant-design-vue', () => ({
	message: { error: vi.fn() },
}))

function profileRow(overrides: Partial<ProjectProfileRowDto>): ProjectProfileRowDto {
	return { id: 'profile-1', project: { id: 'p1' }, favorite: false, ...overrides }
}

function page(content: ProjectProfileRowDto[]): PageDto<ProjectProfileRowDto> {
	return {
		pageNumber: 0,
		pageSize: 200,
		totalPages: 1,
		totalElements: content.length,
		content,
		lastRefresh: '2026-08-01T12:00:00Z',
	}
}

describe('useUserProfiles', () => {
	let data: Ref<PageDto<ProjectProfileRowDto> | null>
	let useFetchMock: Mock
	let fetchMock: Mock
	let refreshNuxtDataMock: Mock

	beforeEach(() => {
		setActivePinia(createPinia())
		data = ref(null)
		useFetchMock = vi.fn(() => ({ data, status: ref('success'), refresh: vi.fn() }))
		fetchMock = vi.fn().mockResolvedValue(undefined)
		refreshNuxtDataMock = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('useFetch', useFetchMock)
		vi.stubGlobal('$fetch', fetchMock)
		vi.stubGlobal('refreshNuxtData', refreshNuxtDataMock)
		vi.stubGlobal('apiErrorMessage', apiErrorMessage)
		vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
		vi.stubGlobal('useRegistryMessage', () => ({
			error: message.error,
			success: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
		}))
		vi.mocked(message.error).mockClear()
		useSessionStore().setSession({ sub: 'user-1' }, 'csrf-token')
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('fetches the caller profiles under the shared key, sorted and unpaged', () => {
		// Arrange + Act
		useUserProfiles()

		// Assert
		expect(useFetchMock).toHaveBeenCalledWith('/api/v2/users/profiles', {
			key: 'user-profiles',
			query: { size: 200, sort: 'name' },
		})
	})

	it('exposes an empty list while nothing is loaded yet', () => {
		// Arrange — data ref still null
		const { profiles } = useUserProfiles()

		// Act + Assert
		expect(profiles.value).toEqual([])
	})

	describe('profile lookup', () => {
		it.each([
			['a membership project', 'p1', 'profile-1'],
			['an unknown project', 'p-unknown', undefined],
			['a profile with no project attached', 'p-null', undefined],
		])('profileForProject resolves %s', (_label, projectId, expectedId) => {
			// Arrange
			data.value = page([profileRow({}), profileRow({ id: 'profile-2', project: null })])
			const { profileForProject } = useUserProfiles()

			// Act
			const profile = profileForProject(projectId)

			// Assert
			expect(profile?.id).toBe(expectedId)
		})

		it.each([
			['a favorite project', profileRow({ favorite: true }), true],
			['a non-favorite project', profileRow({ favorite: false }), false],
			['an unset favorite flag', profileRow({ favorite: undefined }), false],
		])('isFavorite handles %s → %s', (_label, row, expected) => {
			// Arrange
			data.value = page([row])
			const { isFavorite } = useUserProfiles()

			// Act + Assert
			expect(isFavorite('p1')).toBe(expected)
		})

		it('isFavorite is false for a project without a profile', () => {
			// Arrange
			data.value = page([])
			const { isFavorite } = useUserProfiles()

			// Act + Assert
			expect(isFavorite('p1')).toBe(false)
		})
	})

	describe('toggleFavorite', () => {
		it('posts the toggle with the CSRF header and reloads both dashboards', async () => {
			// Arrange
			data.value = page([profileRow({})])
			const { toggleFavorite } = useUserProfiles()

			// Act
			await toggleFavorite('p1')

			// Assert
			expect(fetchMock).toHaveBeenCalledWith('/api/v2/users/profiles/profile-1/favorite', {
				method: 'POST',
				headers: { 'x-csrf-token': 'csrf-token' },
			})
			expect(refreshNuxtDataMock).toHaveBeenCalledWith('user-profiles')
			expect(refreshNuxtDataMock).toHaveBeenCalledWith('home-favorites')
		})

		it('does nothing for a project without a profile (no request, no toast)', async () => {
			// Arrange
			data.value = page([])
			const { toggleFavorite } = useUserProfiles()

			// Act
			await toggleFavorite('p-unknown')

			// Assert
			expect(fetchMock).not.toHaveBeenCalled()
			expect(refreshNuxtDataMock).not.toHaveBeenCalled()
			expect(message.error).not.toHaveBeenCalled()
		})

		it('surfaces a backend failure as a toast and skips the reloads', async () => {
			// Arrange
			data.value = page([profileRow({})])
			fetchMock.mockRejectedValueOnce(Object.assign(new Error('403'), {
				data: { message: 'Accès refusé' },
			}))
			const { toggleFavorite } = useUserProfiles()

			// Act — must not reject: the star has no inline error surface
			await toggleFavorite('p1')

			// Assert
			expect(message.error).toHaveBeenCalledWith('Accès refusé')
			expect(refreshNuxtDataMock).not.toHaveBeenCalled()
		})
	})
})
