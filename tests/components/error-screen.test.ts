import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import ErrorScreen from '../../app/components/ErrorScreen.vue'
import StatusIllustration from '../../app/components/StatusIllustration.vue'
import { apiErrorMessage, isServiceUnavailable } from '../../app/utils/apiError'

/**
 * The screen exists to say WHY, so the assertions are about which wording wins:
 * a sign-in refusal carries the backend's own explanation and it must outrank
 * the generic per-status line, which is all a plain 404/500 has.
 *
 * The illustration is the other half: the product's own artwork is drawn inline
 * so the status colour can reach it, while a deploy's own image is left alone.
 *
 * `computed`, `useRegistryAssets` and `useHead` reach the SFC through Nuxt
 * auto-imports, which vitest does not apply — they are stubbed as globals so the
 * real component mounts.
 */
const REFUSAL = 'Your e-mail address has not been confirmed by the service that connects you.'

let branded = false
const logout = vi.fn()
const clearError = vi.fn()

vi.mock('@stores/session', () => ({ useSessionStore: () => ({ logout }) }))

function mountScreen(error: Record<string, unknown>) {
	return mount(ErrorScreen, {
		props: { error } as never,
		global: {
			components: { StatusIllustration },
			mocks: { $t: (key: string) => key, clearError },
		},
		attachTo: document.body,
	})
}

describe('ErrorScreen', () => {
	beforeEach(() => {
		branded = false
		logout.mockClear()
		clearError.mockClear()
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('useHead', () => undefined)
		vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
		vi.stubGlobal('apiErrorMessage', apiErrorMessage)
		vi.stubGlobal('isServiceUnavailable', isServiceUnavailable)
		vi.stubGlobal('useRegistryAssets', () => ({
			resolve: (key: string) => `/brand/${key}.svg`,
			isDefault: () => !branded,
		}))
		vi.stubGlobal('clearError', clearError)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it.each([
		[404, 'errorPage.notFound'],
		[403, 'errorPage.forbidden'],
		[500, 'errorPage.generic'],
	])('explains a bare %i with the wording of its status', (status, wording) => {
		// Arrange + Act
		const wrapper = mountScreen({ status })

		// Assert
		expect(wrapper.get('h1').text()).toBe(String(status))
		expect(wrapper.get('[data-testid="error-page-message"]').text()).toBe(wording)

		wrapper.unmount()
	})

	it.each([
		[404, '/brand/illustration:notFound.svg'],
		[403, '/brand/illustration:forbidden.svg'],
		[500, '/brand/illustration:error.svg'],
	])('leaves a deploy\'s own %i illustration exactly as it was drawn', (status, illustration) => {
		// Arrange
		branded = true

		// Act
		const wrapper = mountScreen({ status })

		// Assert
		expect(wrapper.get('img').attributes('src')).toBe(illustration)
		expect(wrapper.find('svg').exists()).toBe(false)

		wrapper.unmount()
	})

	it.each([
		[404, '#faad14'],
		[429, '#faad14'],
		[500, '#ff4d4f'],
		[undefined, '#ff4d4f'],
	])('paints the built-in artwork for %s with the colour its status class calls for', (status, colour) => {
		// Arrange + Act
		const wrapper = mountScreen({ status })

		// Assert
		expect(wrapper.find('img').exists()).toBe(false)
		expect(wrapper.get('svg').attributes('style')).toContain(`color: ${colour}`)

		wrapper.unmount()
	})

	it('prefers the refusal the backend explained to the generic status wording', () => {
		// Arrange + Act
		const wrapper = mountScreen({
			status: 403,
			data: { code: 'AUTH_EMAIL_NOT_VERIFIED', message: REFUSAL },
		})

		// Assert
		expect(wrapper.get('[data-testid="error-page-message"]').text()).toBe(REFUSAL)

		wrapper.unmount()
	})

	it.each([
		[503, { code: 'SERVICE_UNAVAILABLE' }],
		[502, {}],
	])('localizes the %i outage itself, since a backend that is down translates nothing', (status, data) => {
		// Arrange + Act
		const wrapper = mountScreen({ status, statusCode: status, data })

		// Assert
		expect(wrapper.get('[data-testid="error-page-message"]').text()).toBe('common.serviceUnavailable')

		wrapper.unmount()
	})

	it('names the reason Spring gave for any other blocking rejection', () => {
		// Arrange + Act
		const wrapper = mountScreen({
			status: 500,
			statusCode: 500,
			data: { code: 'USER_PROFILE_UNREADABLE', title: 'Profile unreadable' },
		})

		// Assert
		expect(wrapper.get('[data-testid="error-page-message"]').text()).toBe('Profile unreadable')

		wrapper.unmount()
	})

	it('falls back to the status wording when the body carries a code but no message', () => {
		// Arrange + Act
		const wrapper = mountScreen({ status: 403, data: { code: 'AUTH_BLOCKED_ACCOUNT' } })

		// Assert
		expect(wrapper.get('[data-testid="error-page-message"]').text()).toBe('errorPage.forbidden')

		wrapper.unmount()
	})

	it.each(['AUTH_EMAIL_NOT_VERIFIED', 'AUTH_EMAIL_ALREADY_USED', 'AUTH_BLOCKED_ACCOUNT'])(
		'offers a sign-out on %s, the only move that clears a refused session',
		async (code) => {
			// Arrange
			const wrapper = mountScreen({ status: 403, data: { code, message: REFUSAL } })

			// Act
			await wrapper.get('[data-testid="error-page-signout"]').trigger('click')

			// Assert
			expect(wrapper.find('[data-testid="error-page-home"]').exists()).toBe(false)
			expect(logout).toHaveBeenCalledOnce()

			wrapper.unmount()
		},
	)

	it.each([
		['an outage', 503, { code: 'SERVICE_UNAVAILABLE' }],
		['a wrong address', 404, undefined],
	])('keeps the home page as the way out of %s, which signing out would not fix', async (_label, status, data) => {
		// Arrange
		const wrapper = mountScreen({ status, statusCode: status, data })

		// Act
		await wrapper.get('[data-testid="error-page-home"]').trigger('click')

		// Assert
		expect(wrapper.find('[data-testid="error-page-signout"]').exists()).toBe(false)
		expect(clearError).toHaveBeenCalledWith({ redirect: '/' })
		expect(logout).not.toHaveBeenCalled()

		wrapper.unmount()
	})

	it('announces the explanation and offers the way out', () => {
		// Arrange + Act
		const wrapper = mountScreen({
			status: 403,
			data: { code: 'AUTH_EMAIL_NOT_VERIFIED', message: REFUSAL },
		})

		// Assert
		expect(wrapper.get('[data-testid="error-page-message"]').attributes('role')).toBe('alert')
		expect(wrapper.get('[data-testid="error-page-signout"]').text()).toBe('auth.logout')
		expect(wrapper.get('svg').attributes('aria-hidden')).toBe('true')

		wrapper.unmount()
	})

	it('has no axe violations', async () => {
		// Arrange
		const wrapper = mountScreen({ status: 403, data: { message: REFUSAL } })

		// Act
		const results = await axe.run(wrapper.element as HTMLElement)

		// Assert
		expect(results.violations.map(violation => `${violation.id}: ${violation.help}`)).toEqual([])

		wrapper.unmount()
	})
})
