import { describe, expect, it } from 'vitest';

import { DateHelper } from '@shared/helpers/date.helper';
import { useTimeZone } from '@shared/helpers/testing/time-zone';
import { DateBoundEnum } from '@shared/models/enumeration/date-bound.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { IntervalModel } from '@shared/models/model/interval.model';

const EARLY: CustomDatetimeModel = { date: '2026-01-05', time: '08:00:00' };
const LATE: CustomDatetimeModel = { date: '2026-03-10', time: '18:30:00' };

function clockOf(date: Date | undefined): (number | undefined)[] {
	return [date?.getHours(), date?.getMinutes(), date?.getSeconds(), date?.getMilliseconds()];
}

function unitsOf(interval: IntervalModel | undefined): (number | undefined)[] {
	return [
		interval?.dayCount.value,
		interval?.hourCount.value,
		interval?.minuteCount.value,
		interval?.secondCount.value,
	];
}

describe('DateHelper', () => {
	describe('elapsedDays', () => {
		it('counts only complete days', () => {
			// Arrange
			const from = new Date('2026-01-05T10:00:00Z');

			// Act
			const days = DateHelper.elapsedDays(from, from.getTime() + (2 * 24 + 23) * 3600 * 1000);

			// Assert
			expect(days).toBe(2);
		});
	});

	describe('formatElapsed', () => {
		it('formats the time since a date as hours, minutes and seconds', () => {
			// Arrange
			const from = new Date('2026-01-05T10:00:00Z');
			const now = from.getTime() + (3600 + 125) * 1000;

			// Act
			const elapsed = DateHelper.formatElapsed(from, now);

			// Assert
			expect(elapsed).toBe('01:02:05');
		});

		it('never goes below zero when the date is in the future', () => {
			// Arrange
			const from = new Date('2026-01-05T10:00:00Z');

			// Act
			const elapsed = DateHelper.formatElapsed(from, from.getTime() - 5000);

			// Assert
			expect(elapsed).toBe('00:00:00');
		});
	});

	describe('formatting and parsing', () => {
		it('formats a date as year-month-day with two-digit parts', () => {
			// Arrange
			const date = new Date(2026, 0, 5, 10, 30);

			// Act
			const formatted = DateHelper.getDate(date);

			// Assert
			expect(formatted).toBe('2026-01-05');
		});

		it('builds a date from a string and leaves a missing value undefined', () => {
			// Arrange
			const value = '2026-01-05T10:00:00.000Z';

			// Act
			const built = DateHelper.buildDate(value);

			// Assert
			expect(built?.toISOString()).toBe(value);
			expect(DateHelper.buildDate(undefined)).toBeUndefined();
		});

		it('keeps the local calendar day when converting to an ISO date', () => {
			// Arrange
			const date = new Date(2026, 0, 5, 23, 59);

			// Act
			const iso = DateHelper.toIsoDate(date);

			// Assert
			expect(iso).toBe('2026-01-05');
			expect(DateHelper.toIsoDate(undefined)).toBeUndefined();
		});

		it('extracts the UTC time with milliseconds and zone designator', () => {
			// Arrange
			const date = new Date(Date.UTC(2026, 0, 5, 10, 30, 15, 123));

			// Act
			const iso = DateHelper.toIsoTime(date);

			// Assert
			expect(iso).toBe('10:30:15.123Z');
			expect(DateHelper.toIsoTime(undefined)).toBeUndefined();
		});

		it('reads an ISO date as UTC midnight', () => {
			// Arrange
			const iso = '2026-01-05';

			// Act
			const date = DateHelper.fromIsoDate(iso);

			// Assert
			expect(date?.toISOString()).toBe('2026-01-05T00:00:00.000Z');
			expect(DateHelper.fromIsoDate(undefined)).toBeUndefined();
		});

		it('reads an ISO time with seconds and milliseconds as UTC', () => {
			// Arrange
			const iso = '10:30:15.123';

			// Act
			const date = DateHelper.fromIsoTime(iso);

			// Assert
			expect([
				date?.getUTCHours(),
				date?.getUTCMinutes(),
				date?.getUTCSeconds(),
				date?.getUTCMilliseconds(),
			]).toEqual([10, 30, 15, 123]);
		});

		it('reads an ISO time that has only hours', () => {
			// Arrange
			const iso = '09';

			// Act
			const date = DateHelper.fromIsoTime(iso);

			// Assert
			expect([date?.getUTCHours(), date?.getUTCMinutes(), date?.getUTCSeconds()]).toEqual([9, 0, 0]);
		});

		it('reads an ISO time that has no seconds', () => {
			// Arrange
			const iso = '10:30';

			// Act
			const date = DateHelper.fromIsoTime(iso);

			// Assert
			expect([date?.getUTCHours(), date?.getUTCMinutes(), date?.getUTCSeconds()]).toEqual([10, 30, 0]);
		});

		it('builds a custom date time from a date and splits it back', () => {
			// Arrange
			const date = new Date(Date.UTC(2026, 0, 5, 10, 30, 0, 0));

			// Act
			const custom = DateHelper.toCustomDateTime(date);

			// Assert
			expect(custom?.time).toBe('10:30:00.000Z');
			expect(custom?.date).toMatch(/^2026-01-0[56]$/);
			expect(DateHelper.toCustomDateTime(undefined)).toBeUndefined();
		});
	});

	describe('toIsoInstant', () => {
		it.each([
			{
				name: 'serializes a date as an ISO instant',
				date: new Date('2026-01-05T10:30:00.000Z'),
				expected: '2026-01-05T10:30:00.000Z',
			},
			{ name: 'keeps a missing date undefined', date: undefined, expected: undefined },
		])('$name', ({ date, expected }) => {
			// Arrange
			const source: Date | undefined = date;

			// Act
			const instant = DateHelper.toIsoInstant(source);

			// Assert
			expect(instant).toBe(expected);
		});
	});

	describe('toDate', () => {
		it('keeps the calendar day of the date whatever the time zone', () => {
			// Arrange
			const dateOnly: CustomDatetimeModel = { date: '2024-05-10', time: undefined };

			// Act
			const date = DateHelper.toDate(dateOnly);

			// Assert
			expect([date?.getFullYear(), date?.getMonth(), date?.getDate()]).toEqual([2024, 4, 10]);
		});

		it('has no date for an empty custom date time', () => {
			// Arrange
			const empties: (CustomDatetimeModel | undefined | null)[] = [
				undefined,
				null,
				{ date: undefined, time: undefined },
			];

			// Act
			const results = empties.map((value: CustomDatetimeModel | undefined | null) => DateHelper.toDate(value));

			// Assert
			expect(results).toEqual([undefined, undefined, undefined]);
		});

		it('treats a blank time like a missing one', () => {
			// Arrange
			const blankTime: CustomDatetimeModel = { date: '2026-01-05', time: '' };

			// Act
			const start = DateHelper.toDate(blankTime, DateBoundEnum.MIN);

			// Assert
			expect([start?.getHours(), start?.getMinutes()]).toEqual([0, 0]);
		});

		it('treats a blank date like the epoch day', () => {
			// Arrange
			const blankDate: CustomDatetimeModel = { date: '', time: '10:30' };

			// Act
			const epochDay = DateHelper.toDate(blankDate, DateBoundEnum.MIN);

			// Assert
			expect([epochDay?.getFullYear(), epochDay?.getMonth(), epochDay?.getDate()]).toEqual([1970, 0, 1]);
		});

		it.each([
			{ name: 'the start of the day for the lower bound', bound: DateBoundEnum.MIN, expected: [0, 0, 0, 0] },
			{ name: 'the end of the day for the upper bound', bound: DateBoundEnum.MAX, expected: [23, 59, 59, 999] },
		])('fills a missing time with $name', ({ bound, expected }) => {
			// Arrange
			const dateOnly: CustomDatetimeModel = { date: '2026-01-05', time: undefined };

			// Act
			const date = DateHelper.toDate(dateOnly, bound);

			// Assert
			expect(clockOf(date)).toEqual(expected);
		});

		it('falls back to the epoch day when only a time is given', () => {
			// Arrange
			const timeOnly: CustomDatetimeModel = { date: undefined, time: '10:00:00' };

			// Act
			const date = DateHelper.toDate(timeOnly);

			// Assert
			expect(date?.getFullYear()).toBe(1970);
		});
	});

	describe('UTC time of a civil date', () => {
		useTimeZone('Europe/Paris');

		it('follows the daylight saving time of the given date, not the one of today', () => {
			// Arrange
			const winter = '2026-01-15';
			const summer = '2026-07-15';

			// Act
			const winterHour = DateHelper.fromIsoTime('08:00:00.000Z', winter)?.getHours();
			const summerHour = DateHelper.fromIsoTime('08:00:00.000Z', summer)?.getHours();

			// Assert
			expect(winterHour).toBe(9);
			expect(summerHour).toBe(10);
		});

		it('reads the time of a custom date time with the offset of its own date', () => {
			// Arrange
			const winter: CustomDatetimeModel = { date: '2026-01-15', time: '08:00:00.000Z' };
			const summer: CustomDatetimeModel = { date: '2026-07-15', time: '08:00:00.000Z' };

			// Act
			const winterDate = DateHelper.toDate(winter);
			const summerDate = DateHelper.toDate(summer);

			// Assert
			expect(winterDate?.getHours()).toBe(9);
			expect(summerDate?.getHours()).toBe(10);
		});

		it('falls back to today when no date is given', () => {
			// Arrange
			const expected = new Date();
			expected.setUTCHours(8, 0, 0, 0);

			// Act
			const hour = DateHelper.fromIsoTime('08:00:00.000Z')?.getHours();

			// Assert
			expect(hour).toBe(expected.getHours());
		});
	});

	describe('comparisons', () => {
		it.each([
			{
				name: 'an earlier one before a later one',
				compare: (): boolean => DateHelper.isCustomBefore(EARLY, LATE),
				expected: true,
			},
			{
				name: 'a later one not before an earlier one',
				compare: (): boolean => DateHelper.isCustomBefore(LATE, EARLY),
				expected: false,
			},
			{
				name: 'a later date after an earlier one',
				compare: (): boolean => DateHelper.isCustomDateAfter(LATE, EARLY),
				expected: true,
			},
			{
				name: 'an earlier date not after a later one',
				compare: (): boolean => DateHelper.isCustomDateAfter(EARLY, LATE),
				expected: false,
			},
		])('orders $name', ({ compare, expected }) => {
			// Arrange
			const order = compare;

			// Act
			const result = order();

			// Assert
			expect(result).toBe(expected);
		});

		it.each([
			{
				name: 'is not before a missing bound',
				compare: (date: Date): boolean => DateHelper.isBefore(date, undefined),
				expected: false,
			},
			{
				name: 'is before when its own value is missing',
				compare: (date: Date): boolean => DateHelper.isBefore(undefined, date),
				expected: true,
			},
			{
				name: 'is not after a missing bound',
				compare: (date: Date): boolean => DateHelper.isAfter(date, undefined),
				expected: false,
			},
			{
				name: 'is after when its own value is missing',
				compare: (date: Date): boolean => DateHelper.isAfter(undefined, date),
				expected: true,
			},
		])('$name', ({ compare, expected }) => {
			// Arrange
			const date = new Date(2026, 0, 5);

			// Act
			const result = compare(date);

			// Assert
			expect(result).toBe(expected);
		});

		it.each([
			{ name: 'an empty begin', actual: { date: undefined, time: undefined }, other: LATE },
			{ name: 'an empty end', actual: EARLY, other: { date: undefined, time: undefined } },
		])('never judges $name as after or equal', ({ actual, other }) => {
			// Arrange
			const comparison = (): boolean => DateHelper.isAfterOrEqual(actual, other);

			// Act
			const result = comparison();

			// Assert
			expect(result).toBe(false);
		});
	});

	describe('buildDateInterval', () => {
		it('breaks a span into units', () => {
			// Arrange
			const start = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
			const end = new Date(start.getTime() + (2 * 24 * 3600 + 3 * 3600 + 4 * 60 + 5) * 1000);

			// Act
			const interval = DateHelper.buildDateInterval(start, end);

			// Assert
			expect(unitsOf(interval)).toEqual([2, 3, 4, 5]);
			expect([interval?.yearCount.value, interval?.monthCount.value]).toEqual([0, 0]);
		});

		it.each([
			{ name: 'without a start', start: undefined, end: new Date(2026, 0, 2) },
			{ name: 'without an end', start: new Date(2026, 0, 1), end: undefined },
			{ name: 'when the end precedes the start', start: new Date(2026, 0, 2), end: new Date(2026, 0, 1) },
		])('has no interval $name', ({ start, end }) => {
			// Arrange
			const bounds = [start, end] as const;

			// Act
			const interval = DateHelper.buildDateInterval(...bounds);

			// Assert
			expect(interval).toBeUndefined();
		});
	});
});
