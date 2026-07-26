import { beforeAll, describe, expect, it, vi } from 'vitest'
import { STATUS_COLOR } from '../../app/utils/statusColors'
import { hasAvailabilityWarning, isInside, presenceColor, presenceValue } from '../../app/utils/presence'

/**
 * `STATUS_COLOR` reaches the util through a Nuxt auto-import, which vitest does
 * not apply — stubbed as a global with the real palette so the assertions are
 * about the mapping and not about a fixture.
 */
beforeAll(() => {
	vi.stubGlobal('STATUS_COLOR', STATUS_COLOR)
})

function participant(value?: string) {
	return { id: 'p1', status: value ? { value, label: 'depuis 3 h' } : null }
}

describe('presenceValue', () => {
	it.each(['IN', 'OUT', 'UNAVAILABLE', 'DEPARTED'])('keeps the phrasable status "%s"', (value) => {
		expect(presenceValue(participant(value))).toBe(value)
	})

	/**
	 * A tag reading a raw enum is worse than no tag: the value names no
	 * translation, so the row drops the state word rather than printing it.
	 */
	it.each([
		['a value the UI cannot phrase', 'ARRIVING'],
		['no status at all', undefined],
	])('drops %s', (_label, value) => {
		expect(presenceValue(participant(value))).toBe('')
	})
})

describe('presenceColor', () => {
	it.each([
		['IN', STATUS_COLOR.success],
		['OUT', STATUS_COLOR.accent],
		['UNAVAILABLE', STATUS_COLOR.neutral],
		['DEPARTED', STATUS_COLOR.info],
	])('paints "%s" with its own colour', (value, expected) => {
		expect(presenceColor(participant(value))).toBe(expected)
	})

	it('falls back to neutral for an unknown status', () => {
		expect(presenceColor(participant('ARRIVING'))).toBe(STATUS_COLOR.neutral)
	})
})

describe('isInside', () => {
	it.each([
		['IN', true],
		['OUT', false],
		['UNAVAILABLE', false],
	])('reads "%s" as inside: %s', (value, expected) => {
		expect(isInside(participant(value))).toBe(expected)
	})
})

/**
 * A window closing is a plan going stale, not a movement — so the flag travels
 * beside the status rather than replacing it, and only when the API sets it.
 */
describe('hasAvailabilityWarning', () => {
	it.each([
		['the API flags the row', true, true],
		['the API clears the flag', false, false],
		['the API omits the flag', undefined, false],
	])('reports %s', (_label, availabilityWarning, expected) => {
		expect(hasAvailabilityWarning({ ...participant('OUT'), availabilityWarning })).toBe(expected)
	})
})
