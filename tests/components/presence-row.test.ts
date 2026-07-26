import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import PresenceRow from '../../app/components/dashboard/PresenceRow.vue'
import { isInside, presenceColor, presenceValue } from '../../app/utils/presence'
import { STATUS_COLOR } from '../../app/utils/statusColors'

/**
 * The row is what the presence board is read through, so what it must never do
 * is state a person's presence by colour alone: the state word leads
 * the tag and the API's duration phrase follows it.
 *
 * `computed`, `useI18n` and the presence helpers reach the SFC through Nuxt
 * auto-imports, which vitest does not apply — stubbed as globals so the real
 * component mounts. EntityAvatar and SearchHighlight are auto-imported
 * components; SearchHighlight is stubbed to its text so the name stays readable
 * in the rendered markup.
 */
const PARTICIPANT = {
	id: 'p1',
	firstName: 'Léa',
	lastName: 'Martin',
	type: { value: 'REGISTERED', label: 'Inscrit' },
	status: { value: 'OUT', label: 'depuis 40 min' },
	groups: [{ id: 'g1', name: 'Les Loups' }, { id: 'g2', name: 'Les Aigles' }],
}

function mountRow(props: Record<string, unknown> = {}) {
	return mount(PresenceRow, {
		props: { participant: PARTICIPANT, ...props },
		attachTo: document.body,
		global: {
			stubs: {
				EntityAvatar: { template: '<span/>' },
				SearchHighlight: { props: ['text', 'query'], template: '<span>{{ text }}</span>' },
				AvailabilityWarningTag: {
					props: ['warned'],
					template: '<span v-if="warned" data-testid="availability-warning"/>',
				},
			},
		},
	})
}

describe('PresenceRow', () => {
	beforeEach(() => {
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
		vi.stubGlobal('presenceValue', presenceValue)
		vi.stubGlobal('presenceColor', presenceColor)
		vi.stubGlobal('isInside', isInside)
		vi.stubGlobal('STATUS_COLOR', STATUS_COLOR)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('names the state before the duration the API phrases', () => {
		// Arrange + Act
		const wrapper = mountRow()

		// Assert
		const tag = wrapper.get('[data-testid="presence-row-status"]')
		expect(tag.get('strong').text()).toBe('filters.presence.OUT')
		expect(tag.text()).toContain('depuis 40 min')

		wrapper.unmount()
	})

	it('upper-cases the surname the way every other list does', () => {
		// Arrange + Act
		const wrapper = mountRow()

		// Assert
		expect(wrapper.text()).toContain('Léa MARTIN')

		wrapper.unmount()
	})

	/**
	 * Inside a group panel the group is the heading above the row, so repeating it
	 * on every line would say nothing.
	 */
	it('names the groups only where they are asked for', () => {
		// Arrange
		const withGroups = mountRow({ withGroups: true })
		const without = mountRow()

		// Assert
		expect(withGroups.get('[data-testid="presence-row-groups"]').text()).toBe('Les Loups · Les Aigles')
		expect(without.find('[data-testid="presence-row-groups"]').exists()).toBe(false)

		withGroups.unmount()
		without.unmount()
	})

	it('offers no checkbox to a caller who cannot record a movement', () => {
		// Arrange + Act
		const wrapper = mountRow()

		// Assert
		expect(wrapper.find('[data-testid="presence-row-select"]').exists()).toBe(false)

		wrapper.unmount()
	})

	it('reports the selection of the row it is on', async () => {
		// Arrange
		const wrapper = mountRow({ selectable: true })

		// Act
		await wrapper.get('input[type="checkbox"]').setValue(true)

		// Assert
		expect(wrapper.emitted('update:selected')).toEqual([[true]])

		wrapper.unmount()
	})

	it('labels the checkbox with the name it selects, and has no axe violations', async () => {
		// Arrange + Act
		const wrapper = mountRow({ selectable: true })

		// Assert
		expect(wrapper.get('[data-testid="presence-row-select"]').attributes('aria-label'))
			.toBe('presenceBoard.select')

		const results = await axe.run(wrapper.element as HTMLElement)
		expect(results.violations).toEqual([])

		wrapper.unmount()
	})

	/**
	 * The board must keep showing someone whose stay has lapsed while a movement of
	 * theirs is still open — losing them is the failure a safety register exists to
	 * prevent — so the row is flagged rather than dropped.
	 */
	it('flags a row whose availability window has closed', () => {
		// Arrange + Act
		const wrapper = mountRow({ participant: { ...PARTICIPANT, availabilityWarning: true } })

		// Assert
		expect(wrapper.find('[data-testid="availability-warning"]').exists()).toBe(true)
	})

	it('leaves an unflagged row unmarked', () => {
		// Arrange + Act
		const wrapper = mountRow()

		// Assert
		expect(wrapper.find('[data-testid="availability-warning"]').exists()).toBe(false)
	})
})
