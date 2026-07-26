import { describe, expect, it } from 'vitest'
import { isDepartureBeforeArrival } from '../../app/utils/availabilityWindow'

/**
 * The boundary rule the backend enforces with `@StartBeforeEnd`, mirrored so
 * the form refuses the round trip. The case that matters is the SAME date on
 * both ends: it is a one-day stay, and it is only legal because the arrival is
 * read as midnight while the departure is read as 23:59:59.
 */
describe('isDepartureBeforeArrival', () => {
	it.each([
		['the same bare date on both ends (a one-day stay)', { date: '2026-08-10' }, { date: '2026-08-10' }],
		['a departure a day later', { date: '2026-08-10' }, { date: '2026-08-11' }],
		['times in order on the same day', { date: '2026-08-10', time: '09:00:00Z' }, {
			date: '2026-08-10',
			time: '17:00:00Z',
		}],
		['a bare arrival date and a timed departure that day', { date: '2026-08-10' }, {
			date: '2026-08-10',
			time: '00:30:00Z',
		}],
		['a timed arrival and a bare departure date that day', {
			date: '2026-08-10',
			time: '23:00:00Z',
		}, { date: '2026-08-10' }],
		['no arrival at all (open-ended)', null, { date: '2026-08-10' }],
		['no departure at all (open-ended)', { date: '2026-08-10' }, null],
		['neither end', null, null],
		['an arrival with no date', { time: '09:00:00Z' }, { date: '2026-08-10' }],
	])('accepts %s', (_label, start, end) => {
		// Arrange

		// Act
		const invalid = isDepartureBeforeArrival(start, end)

		// Assert
		expect(invalid).toBe(false)
	})

	it.each([
		['a departure the day before', { date: '2026-08-11' }, { date: '2026-08-10' }],
		['times out of order on the same day', { date: '2026-08-10', time: '17:00:00Z' }, {
			date: '2026-08-10',
			time: '09:00:00Z',
		}],
		[
			'a timed arrival after the bare departure date it shares',
			{ date: '2026-08-11', time: '10:00:00Z' },
			{ date: '2026-08-10' },
		],
	])('rejects %s', (_label, start, end) => {
		// Arrange

		// Act
		const invalid = isDepartureBeforeArrival(start, end)

		// Assert
		expect(invalid).toBe(true)
	})

	/**
	 * 01:00+02:00 on the 11th is 23:00Z on the 10th, so it precedes midnight on the
	 * 11th even though its wall-clock date is the same day.
	 */
	it('compares offset-carrying times on the instant line, not on the wall clock', () => {
		// Arrange
		const start = { date: '2026-08-11', time: '00:00:00Z' }
		const end = { date: '2026-08-11', time: '01:00:00+02:00' }

		// Act
		const invalid = isDepartureBeforeArrival(start, end)

		// Assert
		expect(invalid).toBe(true)
	})
})
