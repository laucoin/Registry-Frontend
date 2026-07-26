import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AvailabilityWarningTag from '../../app/components/AvailabilityWarningTag.vue'
import { STATUS_COLOR } from '../../app/utils/statusColors'

/**
 * The badge exists to say "this row disagrees with its own schedule" without
 * ever removing the row, so the only behaviour worth pinning is that it appears
 * exactly when the API flags it — and that it carries words, not just a colour.
 *
 * `useI18n` and `STATUS_COLOR` reach the SFC through Nuxt auto-imports, which
 * vitest does not apply; Tooltip is stubbed to its default slot so the tag is
 * reachable without a floating layer.
 */
function mountTag(warned?: boolean | null) {
	return mount(AvailabilityWarningTag, {
		props: { warned },
		global: {
			stubs: { Tooltip: { template: '<span><slot/></span>' } },
		},
	})
}

describe('AvailabilityWarningTag', () => {
	beforeEach(() => {
		vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }))
		vi.stubGlobal('STATUS_COLOR', STATUS_COLOR)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('names the anomaly when the API flags the row', () => {
		// Arrange + Act
		const wrapper = mountTag(true)

		// Assert
		expect(wrapper.find('[data-testid="availability-warning"]').exists()).toBe(true)
		expect(wrapper.text()).toContain('presence.availabilityWarning.label')
	})

	it.each([
		['the API clears the flag', false],
		['the API omits the flag', undefined],
		['the API sends null', null],
	])('renders nothing when %s', (_label, warned) => {
		// Arrange + Act
		const wrapper = mountTag(warned)

		// Assert
		expect(wrapper.find('[data-testid="availability-warning"]').exists()).toBe(false)
	})
})
