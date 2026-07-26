import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import ApiErrorAlert from '../../app/components/ApiErrorAlert.vue'

/**
 * The alert has two jobs and they are tested apart from the rule behind them
 * (useSessionReconnect has its own test, and is stubbed here): it must offer
 * the reconnect button exactly when the rule says so, and it must pick the
 * right SHAPE — a heading with the explanation under it when the caller names
 * one, the explanation alone otherwise.
 *
 * `computed`, `useI18n`, `apiErrorMessage` and `useSessionReconnect` reach the
 * SFC through Nuxt auto-imports, which vitest does not apply — they are stubbed
 * as globals so the real component mounts.
 */
const EXPLANATION = 'Your session has expired. Signing you in again…'

const reconnect = vi.fn()
let offered = true

function mountAlert(props: Record<string, unknown> = {}) {
	return mount(ApiErrorAlert, {
		props: { error: { data: { code: 'REAUTHENTICATION_REQUIRED' } }, ...props },
		attachTo: document.body,
	})
}

describe('ApiErrorAlert', () => {
	beforeEach(() => {
		offered = true
		reconnect.mockClear()
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
		vi.stubGlobal('apiErrorMessage', () => EXPLANATION)
		vi.stubGlobal('useSessionReconnect', () => ({
			offersReconnect: () => offered,
			reconnectLabel: ref('common.reconnect'),
			reconnect,
		}))
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('offers the reconnect button when the session is gone', async () => {
		// Arrange
		const wrapper = mountAlert()

		// Act
		const button = wrapper.find('[data-testid="session-reconnect"]')
		await button.trigger('click')

		// Assert
		expect(button.text()).toBe('common.reconnect')
		expect(reconnect).toHaveBeenCalledOnce()

		wrapper.unmount()
	})

	it('offers no button for a failure the reader cannot act on', () => {
		// Arrange
		offered = false

		// Act
		const wrapper = mountAlert({ error: new Error('boom') })

		// Assert
		expect(wrapper.find('[data-testid="session-reconnect"]').exists()).toBe(false)

		wrapper.unmount()
	})

	it('puts the explanation under the heading the caller names', () => {
		// Arrange + Act
		const wrapper = mountAlert({ message: 'common.loadError' })

		// Assert
		expect(wrapper.get('.ant-alert-message').text()).toBe('common.loadError')
		expect(wrapper.get('.ant-alert-description').text()).toBe(EXPLANATION)

		wrapper.unmount()
	})

	it('makes the explanation the whole notice when no heading is named', () => {
		// Arrange + Act
		const wrapper = mountAlert()

		// Assert
		expect(wrapper.get('.ant-alert-message').text()).toBe(EXPLANATION)
		expect(wrapper.find('.ant-alert-description').exists()).toBe(false)

		wrapper.unmount()
	})

	it('has no axe violations', async () => {
		// Arrange
		const wrapper = mountAlert({ message: 'common.loadError' })

		// Act
		const results = await axe.run(wrapper.element as HTMLElement)

		// Assert
		expect(results.violations.map(violation => `${violation.id}: ${violation.help}`)).toEqual([])

		wrapper.unmount()
	})
})
