import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import ListLoadMore from '../../app/components/ListLoadMore.vue'

/**
 * The foot of every lazily loaded list. What is pinned here is the part that is
 * not visual: the button exists so the next chunk is reachable without a mouse,
 * it stays operable-but-declining while a chunk loads rather than disabling
 * itself out from under the focus, and the count is announced politely — an
 * alert would interrupt the reader for rows arriving exactly as asked.
 *
 * The observer is stubbed: it is the browser's, not ours, and intersection
 * cannot happen in a layout-less DOM.
 */
let observedCallback: ((entries: { isIntersecting: boolean }[]) => void) | undefined

function mountFooter(props: Record<string, unknown> = {}) {
	return mount(ListLoadMore, {
		props: { hasMore: true, loading: false, loaded: 20, total: 87, testid: 'participant', ...props },
		attachTo: document.body,
	})
}

describe('ListLoadMore', () => {
	beforeEach(() => {
		observedCallback = undefined
		vi.stubGlobal('useTemplateRef', () => ref(null))
		vi.stubGlobal('useI18n', () => ({
			t: (key: string, values?: Record<string, unknown>) =>
				(values ? `${key}:${JSON.stringify(values)}` : key),
		}))
		vi.stubGlobal('useIntersectionObserver', (
			_target: unknown,
			callback: (entries: { isIntersecting: boolean }[]) => void,
		) => {
			observedCallback = callback
		})
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('asks for the next chunk when the button is pressed', async () => {
		// Arrange
		const wrapper = mountFooter()

		// Act
		await wrapper.get('[data-testid="participant-load-more"]').trigger('click')

		// Assert
		expect(wrapper.emitted('load')).toHaveLength(1)

		wrapper.unmount()
	})

	it('asks for the next chunk when the sentinel comes into view', () => {
		// Arrange
		const wrapper = mountFooter()

		// Act
		observedCallback?.([{ isIntersecting: true }])

		// Assert
		expect(wrapper.emitted('load')).toHaveLength(1)

		wrapper.unmount()
	})

	/**
	 * Both paths can fire while a chunk is already in flight — the sentinel stays
	 * in view under the spinner, and the button stays clickable on purpose.
	 */
	it('declines while a chunk is already loading, without disabling the button', async () => {
		// Arrange
		const wrapper = mountFooter({ loading: true })

		// Act
		await wrapper.get('[data-testid="participant-load-more"]').trigger('click')
		observedCallback?.([{ isIntersecting: true }])

		// Assert
		expect(wrapper.emitted('load')).toBeUndefined()
		expect(wrapper.get('[data-testid="participant-load-more"]').attributes('disabled')).toBeUndefined()
		expect(wrapper.get('.load-more').attributes('aria-busy')).toBe('true')

		wrapper.unmount()
	})

	it('drops the sentinel and the button once every row is loaded', () => {
		// Arrange + Act
		const wrapper = mountFooter({ hasMore: false, loaded: 87 })

		// Assert
		expect(wrapper.find('[data-testid="participant-load-more"]').exists()).toBe(false)
		expect(wrapper.find('.load-more__sentinel').exists()).toBe(false)
		expect(wrapper.get('[aria-live="polite"]').text()).toContain('common.list.allLoaded')

		wrapper.unmount()
	})

	it('announces the running count politely, never as an alert', () => {
		// Arrange + Act
		const wrapper = mountFooter()

		// Assert
		const region = wrapper.get('[aria-live="polite"]')
		expect(region.text()).toContain('common.list.loaded')
		expect(region.attributes('role')).toBeUndefined()
		expect(wrapper.find('[role="alert"]').exists()).toBe(false)

		wrapper.unmount()
	})

	it('renders nothing at all for an empty list', () => {
		// Arrange + Act
		const wrapper = mountFooter({ total: 0, loaded: 0, hasMore: false })

		// Assert
		expect(wrapper.find('.load-more').exists()).toBe(false)

		wrapper.unmount()
	})

	it('hides the sentinel from assistive technology and has no axe violations', async () => {
		// Arrange
		const wrapper = mountFooter()

		// Act
		const results = await axe.run(wrapper.element as HTMLElement)

		// Assert
		expect(wrapper.get('.load-more__sentinel').attributes('aria-hidden')).toBe('true')
		expect(results.violations.map(violation => `${violation.id}: ${violation.help}`)).toEqual([])

		wrapper.unmount()
	})
})
