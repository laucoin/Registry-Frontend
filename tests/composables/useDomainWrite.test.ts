import { useSessionStore } from '@stores/session'
import { message } from 'ant-design-vue'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { computed } from 'vue'
import { useDomainWrite } from '../../app/composables/useDomainWrite'
import { apiErrorMessage } from '../../app/utils/apiError'

vi.mock('ant-design-vue', () => ({
	message: { error: vi.fn() },
}))

const OPTIONS = {
	projectId: () => 'p1',
	basePath: () => '/api/v2/projects/p1/movements',
	fetchKey: () => 'movements-p1',
	permissionPrefix: 'MOVEMENT',
}

describe('useDomainWrite', () => {
	let fetchMock: Mock
	let refreshMock: Mock

	beforeEach(() => {
		setActivePinia(createPinia())
		fetchMock = vi.fn().mockResolvedValue(undefined)
		refreshMock = vi.fn().mockResolvedValue(undefined)
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('$fetch', fetchMock)
		vi.stubGlobal('refreshNuxtData', refreshMock)
		// Auto-imported app util — wire the real implementation.
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

	describe('authority flags', () => {
		it.each([
			['canCreate', 'MOVEMENT_C'],
			['canUpdate', 'MOVEMENT_U'],
			['canDelete', 'MOVEMENT_D'],
		] as const)('%s mirrors the exact per-project %s authority', (flag, permission) => {
			// Arrange
			const sessionStore = useSessionStore()
			sessionStore.setProfile(null, [`p1_${permission}`])

			// Act
			const write = useDomainWrite(OPTIONS)

			// Assert — only the matching flag is on
			expect(write[flag].value).toBe(true)
			const others = (['canCreate', 'canUpdate', 'canDelete'] as const).filter(other => other !== flag)
			for (const other of others) {
				expect(write[other].value).toBe(false)
			}
		})

		it('denies every flag when the authorities belong to another project', () => {
			// Arrange — tenant isolation
			const sessionStore = useSessionStore()
			sessionStore.setProfile(null, ['p2_MOVEMENT_C', 'p2_MOVEMENT_U', 'p2_MOVEMENT_D'])

			// Act
			const write = useDomainWrite(OPTIONS)

			// Assert
			expect(write.canCreate.value).toBe(false)
			expect(write.canUpdate.value).toBe(false)
			expect(write.canDelete.value).toBe(false)
		})
	})

	describe('create / update (form-owned error surface)', () => {
		it('create posts with the CSRF header and reloads the keyed list', async () => {
			// Arrange
			const write = useDomainWrite(OPTIONS)
			const body = { participantId: 'part-1', type: 'OUT' }

			// Act
			await write.create(body)

			// Assert
			expect(fetchMock).toHaveBeenCalledWith('/api/v2/projects/p1/movements', {
				method: 'POST',
				headers: { 'x-csrf-token': 'csrf-token' },
				body,
			})
			expect(refreshMock).toHaveBeenCalledWith('movements-p1')
		})

		it('update patches the row and reloads', async () => {
			// Arrange
			const write = useDomainWrite(OPTIONS)

			// Act
			await write.update('m1', { comment: 'edited' })

			// Assert
			expect(fetchMock).toHaveBeenCalledWith('/api/v2/projects/p1/movements/m1', {
				method: 'PATCH',
				headers: { 'x-csrf-token': 'csrf-token' },
				body: { comment: 'edited' },
			})
			expect(refreshMock).toHaveBeenCalledWith('movements-p1')
		})

		it.each([
			['create', (write: ReturnType<typeof useDomainWrite>) => write.create({})],
			['update', (write: ReturnType<typeof useDomainWrite>) => write.update('m1', {})],
		])('%s rethrows a backend failure (no toast) and skips the reload', async (_label, act) => {
			// Arrange
			const failure = Object.assign(new Error('422'), { data: { message: 'Champ requis' } })
			fetchMock.mockRejectedValueOnce(failure)
			const write = useDomainWrite(OPTIONS)

			// Act + Assert — the form owns the inline error surface
			await expect(act(write)).rejects.toBe(failure)
			expect(refreshMock).not.toHaveBeenCalled()
			expect(message.error).not.toHaveBeenCalled()
		})
	})

	describe('transition / remove (toast-owned error surface)', () => {
		it('transition posts the domain verb and reloads', async () => {
			// Arrange
			const write = useDomainWrite(OPTIONS)

			// Act
			await write.transition('m1', 'resolve')

			// Assert
			expect(fetchMock).toHaveBeenCalledWith('/api/v2/projects/p1/movements/m1/resolve', {
				method: 'POST',
				headers: { 'x-csrf-token': 'csrf-token' },
			})
			expect(refreshMock).toHaveBeenCalledWith('movements-p1')
		})

		it('remove deletes the row and reloads', async () => {
			// Arrange
			const write = useDomainWrite(OPTIONS)

			// Act
			await write.remove('m1')

			// Assert
			expect(fetchMock).toHaveBeenCalledWith('/api/v2/projects/p1/movements/m1', {
				method: 'DELETE',
				headers: { 'x-csrf-token': 'csrf-token' },
			})
			expect(refreshMock).toHaveBeenCalledWith('movements-p1')
		})

		it.each([
			['transition', (write: ReturnType<typeof useDomainWrite>) => write.transition('m1', 'resolve')],
			['remove', (write: ReturnType<typeof useDomainWrite>) => write.remove('m1')],
		])('%s surfaces a rejected backend rule as a toast and swallows the error', async (_label, act) => {
			// Arrange
			const failure = Object.assign(new Error('409'), {
				data: { message: 'ALERT_DELETE_HAS_COMMUNICATION' },
			})
			fetchMock.mockRejectedValueOnce(failure)
			const write = useDomainWrite(OPTIONS)

			// Act — must not reject: row menus have no inline error surface
			await act(write)

			// Assert
			expect(message.error).toHaveBeenCalledWith('ALERT_DELETE_HAS_COMMUNICATION')
			expect(refreshMock).not.toHaveBeenCalled()
		})
	})

	it('reload refreshes the current fetch key on demand', async () => {
		// Arrange
		const write = useDomainWrite(OPTIONS)

		// Act
		await write.reload()

		// Assert
		expect(refreshMock).toHaveBeenCalledWith('movements-p1')
	})
})
