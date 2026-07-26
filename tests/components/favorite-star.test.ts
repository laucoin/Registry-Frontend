import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref, watch } from 'vue'
import FavoriteStar from '../../app/components/dashboard/FavoriteStar.vue'
import { stubVueUseTimers } from '../support/vueuse-timers'

/**
 * The star's celebration is deliberately bound to the ACT of favouriting rather
 * than to the `active` prop: a class driven by `active` alone would replay on
 * every mount, so each already-starred project on the dashboard would pop in
 * unison on every navigation. These tests pin that edge — on the false → true
 * transition only — because the difference is invisible in a static render and
 * would be easy to "simplify" back into a bug.
 *
 * `ref`, `watch`, `useTimeoutFn` and `useI18n` reach the SFC through Nuxt
 * auto-imports, which vitest does not apply — stub them as globals so the real
 * component mounts.
 */
beforeAll(() => {
	vi.stubGlobal('ref', ref)
	vi.stubGlobal('watch', watch)
	vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
	stubVueUseTimers()
})

afterAll(() => {
	vi.unstubAllGlobals()
})

afterEach(() => {
	vi.useRealTimers()
})

const CELEBRATING = 'fav-star--celebrating'

function mountStar(active: boolean) {
	return mount(FavoriteStar, { props: { active }, attachTo: document.body })
}

describe('FavoriteStar', () => {
	it('celebrates when the star is switched on', async () => {
		// Arrange
		const wrapper = mountStar(false)

		// Act
		await wrapper.setProps({ active: true })

		// Assert
		expect(wrapper.get('button').classes()).toContain(CELEBRATING)

		wrapper.unmount()
	})

	it('does not celebrate a project that is already a favourite on mount', () => {
		// Arrange + Act
		const wrapper = mountStar(true)

		// Assert
		expect(wrapper.get('button').classes()).not.toContain(CELEBRATING)

		wrapper.unmount()
	})

	it('does not celebrate when the star is switched off', async () => {
		// Arrange
		const wrapper = mountStar(true)

		// Act
		await wrapper.setProps({ active: false })

		// Assert
		expect(wrapper.get('button').classes()).not.toContain(CELEBRATING)

		wrapper.unmount()
	})

	it('drops the celebration once the animation has run', async () => {
		// Arrange
		vi.useFakeTimers()
		const wrapper = mountStar(false)

		// Act
		await wrapper.setProps({ active: true })
		vi.advanceTimersByTime(500)
		await wrapper.vm.$nextTick()

		// Assert
		expect(wrapper.get('button').classes()).not.toContain(CELEBRATING)

		wrapper.unmount()
	})

	it('keeps the pressed state readable without colour, and has no axe violations', async () => {
		// Arrange + Act
		const wrapper = mountStar(true)

		// Assert
		expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
		expect(wrapper.get('button').attributes('aria-label')).toBe('dashboard.favorite.remove')

		const results = await axe.run(wrapper.element as HTMLElement)
		expect(results.violations).toEqual([])

		wrapper.unmount()
	})
})
