import { useSessionStore } from '@stores/session'
import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import OngoingOutingList from '../../app/components/dashboard/OngoingOutingList.vue'
import { overrunMinutes } from '../../app/utils/movementRules'
import { outingActivityId, repeatedOutingActivityIds } from '../../app/utils/ongoingOutings'
import { STATUS_COLOR } from '../../app/utils/statusColors'

/**
 * The dashboard panel and the board tab used to draw the same outings from two
 * markups, and only one of them read. This list is the surviving one, so what
 * is pinned here is what made it readable: the two parties on the same activity
 * that only their departure time tells apart, and the timer that says WHICH
 * clock it is counting — the last contact, or plainly the departure.
 *
 * The auto-imports vitest does not apply are stubbed as globals; the row, the
 * detail line and the thread are components of their own, tested elsewhere and
 * stubbed here.
 */
const PROJECT_ID = 'p1'
const NOW = new Date('2026-08-18T12:00:00Z')

function outing(overrides: Record<string, unknown> = {}) {
	return {
		id: 'm1',
		dateTime: '2026-08-18T09:15:00Z',
		type: { value: 'OUT', label: 'Sortie' },
		reason: { value: 'a1', label: 'Randonnée du lac', kind: 'ACTIVITY' },
		lastCommunicationAt: null,
		...overrides,
	}
}

function mountList(movements: Record<string, unknown>[]) {
	return mount(OngoingOutingList, {
		props: { projectId: PROJECT_ID, movements },
		attachTo: document.body,
		global: {
			stubs: {
				ProjectMovementRow: {
					props: ['movement', 'reasonLabel'],
					template: '<div class="row"><span class="reason">{{ reasonLabel }}</span><slot/></div>',
				},
				DashboardOutingDetails: { template: '<span/>' },
				ProjectCommunicationThread: { template: '<span/>' },
			},
		},
	})
}

describe('OngoingOutingList', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		vi.stubGlobal('computed', computed)
		vi.stubGlobal('ref', ref)
		vi.stubGlobal('useI18n', () => ({
			t: (key: string) => key,
			d: (value: Date) => value.toISOString().slice(11, 16),
		}))
		vi.stubGlobal('useElapsed', () => ({
			duration: (ms: number) => `${Math.round(ms / 60_000)} min`,
			elapsedSince: () => '2 h 45',
			nowMs: ref(NOW.getTime()),
		}))
		vi.stubGlobal('overrunMinutes', overrunMinutes)
		vi.stubGlobal('outingActivityId', outingActivityId)
		vi.stubGlobal('repeatedOutingActivityIds', repeatedOutingActivityIds)
		vi.stubGlobal('refreshNuxtData', vi.fn())
		vi.stubGlobal('STATUS_COLOR', STATUS_COLOR)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('names the activity a party left on', () => {
		// Arrange + Act
		const wrapper = mountList([outing()])

		// Assert
		expect(wrapper.get('.reason').text()).toBe('Randonnée du lac')

		wrapper.unmount()
	})

	/**
	 * Two parties on the same walk read identically; the departure time is the
	 * only thing that tells them apart, so it is appended to those rows and only
	 * to those.
	 */
	it('dates the rows of two parties out on the same activity', () => {
		// Arrange + Act
		const wrapper = mountList([
			outing(),
			outing({ id: 'm2', dateTime: '2026-08-18T10:30:00Z' }),
		])

		// Assert
		const reasons = wrapper.findAll('.reason').map(reason => reason.text())
		expect(reasons).toEqual(['Randonnée du lac (09:15)', 'Randonnée du lac (10:30)'])

		wrapper.unmount()
	})

	it('warns about an outing running past its planned duration', () => {
		// Arrange + Act
		const wrapper = mountList([
			outing({ reason: { value: 'a1', label: 'Randonnée du lac', kind: 'ACTIVITY', duration: 'PT2H' } }),
		])

		// Assert
		expect(wrapper.find('[data-testid="ongoing-outing-overrun"]').exists()).toBe(true)

		wrapper.unmount()
	})

	it('leaves an outing still within its planned duration unflagged', () => {
		// Arrange + Act
		const wrapper = mountList([
			outing({ reason: { value: 'a1', label: 'Randonnée du lac', kind: 'ACTIVITY', duration: 'PT6H' } }),
		])

		// Assert
		expect(wrapper.find('[data-testid="ongoing-outing-overrun"]').exists()).toBe(false)

		wrapper.unmount()
	})

	/**
	 * Without the COMMUNICATION option there is no contact to count from, so the
	 * timer must say what it is actually counting rather than borrow the wording
	 * of a feature the project does not have.
	 */
	it('counts from the departure when the project has no communications', () => {
		// Arrange + Act
		const wrapper = mountList([outing({ lastCommunicationAt: '2026-08-18T11:00:00Z' })])

		// Assert
		expect(wrapper.text()).toContain('projectHome.sinceDeparture')

		wrapper.unmount()
	})

	it('counts from the last contact once the project has communications', () => {
		// Arrange
		useSessionStore().authorities = [`${PROJECT_ID}_REGISTRY_PROJECT_OPTION_COMMUNICATION`]

		// Act
		const wrapper = mountList([outing({ lastCommunicationAt: '2026-08-18T11:00:00Z' })])

		// Assert
		expect(wrapper.text()).toContain('dashboard.overview.ongoing.lastContact')

		wrapper.unmount()
	})

	it('says an outing has had no contact yet, and has no axe violations', async () => {
		// Arrange
		useSessionStore().authorities = [`${PROJECT_ID}_REGISTRY_PROJECT_OPTION_COMMUNICATION`]

		// Act
		const wrapper = mountList([outing()])

		// Assert
		expect(wrapper.text()).toContain('dashboard.overview.ongoing.noContact')

		const results = await axe.run(wrapper.element as HTMLElement)
		expect(results.violations).toEqual([])

		wrapper.unmount()
	})
})
