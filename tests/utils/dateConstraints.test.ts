import dayjs, { type Dayjs } from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { disableFutureDate, disableFutureTime, isFutureDateTime } from '../../app/utils/dateConstraints'

// The "nothing in the future" rule for movements/alerts/communications. Frozen
// clock: 2026-08-01 12:30:30 local time, so hour/minute/second boundaries are
// deterministic.
const NOW = new Date(2026, 7, 1, 12, 30, 30)

function ints(start: number, end: number): number[] {
	return Array.from({ length: end - start }, (_, i) => start + i)
}

describe('dateConstraints', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(NOW)
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	describe('disableFutureDate', () => {
		it.each([
			['tomorrow', () => dayjs().add(1, 'day'), true],
			['next month', () => dayjs().add(1, 'month'), true],
			['later today (day granularity)', () => dayjs().endOf('day'), false],
			['now', () => dayjs(), false],
			['yesterday', () => dayjs().subtract(1, 'day'), false],
			['the distant past', () => dayjs('1970-01-01'), false],
		])('disables %s → %s', (_label, make, expected) => {
			// Arrange
			const current = make()

			// Act
			const disabled = disableFutureDate(current)

			// Assert
			expect(disabled).toBe(expected)
		})

		it('treats a missing date as enabled (guard branch)', () => {
			// Arrange — AntD can call with an empty cell
			const current = null as unknown as Dayjs

			// Act
			const disabled = disableFutureDate(current)

			// Assert
			expect(disabled).toBe(false)
		})
	})

	describe('disableFutureTime', () => {
		it.each([
			['null', () => null],
			['yesterday', () => dayjs().subtract(1, 'day')],
			['tomorrow (day handled by disabled-date)', () => dayjs().add(1, 'day')],
		])('returns no constraints for %s', (_label, make) => {
			// Arrange
			const current = make()

			// Act
			const constraints = disableFutureTime(current)

			// Assert
			expect(constraints).toEqual({})
		})

		it('disables the future hours of today', () => {
			// Arrange
			const today = dayjs()

			// Act
			const constraints = disableFutureTime(today)

			// Assert — now is 12:xx, so 13..23 are out
			expect(constraints.disabledHours?.()).toEqual(ints(13, 24))
		})

		it.each([
			['the current hour', 12, ints(31, 60)],
			['a past hour', 11, []],
		])('disables future minutes only within %s', (_label, hour, expected) => {
			// Arrange
			const constraints = disableFutureTime(dayjs())

			// Act
			const disabledMinutes = constraints.disabledMinutes?.(hour)

			// Assert — now is xx:30, so 31..59 are out at 12h only
			expect(disabledMinutes).toEqual(expected)
		})

		it.each([
			['the current minute', 12, 30, ints(31, 60)],
			['a past minute of the current hour', 12, 29, []],
			['the same minute of a past hour', 11, 30, []],
		])('disables future seconds only within %s', (_label, hour, minute, expected) => {
			// Arrange
			const constraints = disableFutureTime(dayjs())

			// Act
			const disabledSeconds = constraints.disabledSeconds?.(hour, minute)

			// Assert — now is xx:xx:30
			expect(disabledSeconds).toEqual(expected)
		})

		it('disables nothing at the end-of-day boundary (empty ranges, never negative lengths)', () => {
			// Arrange
			vi.setSystemTime(new Date(2026, 7, 1, 23, 59, 59))

			// Act
			const constraints = disableFutureTime(dayjs())

			// Assert
			expect(constraints.disabledHours?.()).toEqual([])
			expect(constraints.disabledMinutes?.(23)).toEqual([])
			expect(constraints.disabledSeconds?.(23, 59)).toEqual([])
		})
	})

	describe('isFutureDateTime', () => {
		it.each([
			['one second ahead', () => dayjs().add(1, 'second'), true],
			['one day ahead', () => dayjs().add(1, 'day'), true],
			['exactly now (strict isAfter)', () => dayjs(), false],
			['one second ago', () => dayjs().subtract(1, 'second'), false],
			['null (empty picker)', () => null, false],
		])('flags %s → %s', (_label, make, expected) => {
			// Arrange
			const value = make()

			// Act
			const future = isFutureDateTime(value)

			// Assert
			expect(future).toBe(expected)
		})
	})
})
