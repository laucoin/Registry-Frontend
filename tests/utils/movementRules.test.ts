import { describe, expect, it } from 'vitest'
import {
	alreadyInTargetState,
	capacityWarning,
	overrunMinutes,
	parseIsoDurationMinutes,
	reasonApplies,
	reasonRequired,
} from '../../app/utils/movementRules'

const NOW = new Date('2026-08-10T12:00:00Z').getTime()

function minutesAgo(minutes: number): string {
	return new Date(NOW - minutes * 60_000).toISOString()
}

describe('reasonApplies', () => {
	it.each([
		['a registered exit carries a reason', 'OUT', 'REGISTERED', true],
		['a registered entry is just a return', 'IN', 'REGISTERED', false],
		['a guest entry carries a reason', 'IN', 'GUEST', true],
		['a guest exit is just leaving', 'OUT', 'GUEST', false],
	] as const)('%s', (_label, direction, contentType, expected) => {
		// Arrange

		// Act
		const applies = reasonApplies(direction, contentType)

		// Assert
		expect(applies).toBe(expected)
	})
})

describe('reasonRequired', () => {
	it.each([
		['a registered exit without an activity', 'OUT', 'REGISTERED', false, true],
		['a registered exit justified by an activity', 'OUT', 'REGISTERED', true, false],
		['a registered entry', 'IN', 'REGISTERED', false, false],
		['a guest entry', 'IN', 'GUEST', false, true],
		['a guest exit', 'OUT', 'GUEST', false, false],
	] as const)('%s', (_label, direction, contentType, hasActivity, expected) => {
		// Arrange

		// Act
		const required = reasonRequired(direction, contentType, hasActivity)

		// Assert
		expect(required).toBe(expected)
	})
})

describe('capacityWarning', () => {
	it.each([
		['over the maximum', 12, { lower: 2, upper: 10 }, { kind: 'over', limit: 10 }],
		['under the minimum', 1, { lower: 4, upper: 10 }, { kind: 'under', limit: 4 }],
		['inside the range', 5, { lower: 2, upper: 10 }, null],
		['exactly on the maximum', 10, { lower: 2, upper: 10 }, null],
		['exactly on the minimum', 2, { lower: 2, upper: 10 }, null],
		['an empty selection (nothing to judge yet)', 0, { lower: 4, upper: 10 }, null],
		['no capacity stated', 99, { lower: null, upper: null }, null],
		['no capacity object at all', 99, null, null],
	])('reports %s', (_label, count, capacity, expected) => {
		// Arrange

		// Act
		const warning = capacityWarning(count, capacity)

		// Assert
		expect(warning).toEqual(expected)
	})
})

describe('parseIsoDurationMinutes', () => {
	it.each([
		['hours and minutes', 'PT2H30M', 150],
		['hours only', 'PT2H', 120],
		['minutes only', 'PT45M', 45],
		['days', 'P1D', 1440],
		['days and time', 'P1DT2H', 1560],
		['seconds rounded into minutes', 'PT90S', 1.5],
		['a zero duration', 'PT0M', 0],
	])('parses %s', (_label, iso, expected) => {
		// Arrange

		// Act
		const minutes = parseIsoDurationMinutes(iso)

		// Assert
		expect(minutes).toBe(expected)
	})

	it.each([
		['null', null],
		['undefined', undefined],
		['an empty string', ''],
		['a bare P with nothing in it', 'P'],
		['plain text', 'two hours'],
		['a wall-clock time', '02:30'],
	])('returns null for %s', (_label, iso) => {
		// Arrange

		// Act + Assert
		expect(parseIsoDurationMinutes(iso)).toBeNull()
	})
})

describe('overrunMinutes', () => {
	it('reports how far an outing has run past its planned duration', () => {
		// Arrange

		// Act
		const over = overrunMinutes(minutesAgo(180), 'PT2H', NOW)

		// Assert
		expect(over).toBe(60)
	})

	it.each([
		['still inside the planned duration', minutesAgo(30), 'PT2H'],
		['exactly on the planned duration', minutesAgo(120), 'PT2H'],
		['an activity that states no duration', minutesAgo(600), null],
		['an outing with no start time', null, 'PT2H'],
	])('reports nothing for %s', (_label, startedAt, planned) => {
		// Arrange

		// Act + Assert
		expect(overrunMinutes(startedAt, planned, NOW)).toBeNull()
	})
})

describe('alreadyInTargetState', () => {
	it.each([
		['adding someone already on site to an entry', 'IN', 'IN', true],
		['adding someone already out to an exit', 'OUT', 'OUT', true],
		['adding someone out to an entry (a real arrival)', 'IN', 'OUT', false],
		['adding someone on site to an exit (a real departure)', 'OUT', 'IN', false],
		['an unavailable participant', 'OUT', 'UNAVAILABLE', false],
		['an unknown status', 'IN', null, false],
	] as const)('%s', (_label, direction, status, expected) => {
		// Arrange

		// Act
		const redundant = alreadyInTargetState(direction, status)

		// Assert
		expect(redundant).toBe(expected)
	})
})
