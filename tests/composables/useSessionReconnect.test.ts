import { REAUTH_REQUIRED_CODE, SERVICE_UNAVAILABLE_CODE } from '@shared/utils/api-errors'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { useSessionReconnect } from '../../app/composables/useSessionReconnect'

/**
 * The offer is made for ONE failure and always leads to the same
 * place, so both surfaces that carry it (the inline alert, the corner
 * notification) can be trusted to agree. The Nuxt auto-imports the composable
 * relies on are stubbed as globals; vitest does not apply them.
 */
const CURRENT_PATH = '/projects/p1?tab=alerts'

describe('useSessionReconnect', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
		vi.stubGlobal('useRoute', () => ({ fullPath: CURRENT_PATH }))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it.each([
		['a dead session', { data: { code: REAUTH_REQUIRED_CODE } }, true],
		['an outage', { data: { code: SERVICE_UNAVAILABLE_CODE } }, false],
		['a backend rejection', { data: { message: 'Name already taken' } }, false],
		['a plain failure', new Error('boom'), false],
		['a local validation string', 'The name is required.', false],
	])('offers the way back in for %s: %s', (_label, error, expected) => {
		// Arrange
		const { offersReconnect } = useSessionReconnect()

		// Act + Assert
		expect(offersReconnect(error)).toBe(expected)
	})

	it('reconnects through the BFF login, returning to the page in view', () => {
		// Arrange
		const navigateMock = vi.fn()
		vi.stubGlobal('navigateTo', navigateMock)
		const { reconnect } = useSessionReconnect()

		// Act
		reconnect()

		// Assert
		expect(navigateMock).toHaveBeenCalledWith(
			`/auth/login?redirect=${encodeURIComponent(CURRENT_PATH)}`,
			{ external: true },
		)
	})

	it('labels the action from the shared key', () => {
		// Arrange + Act
		const { reconnectLabel } = useSessionReconnect()

		// Assert
		expect(reconnectLabel.value).toBe('common.reconnect')
	})
})
