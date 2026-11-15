import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { DateFormatTypeEnum } from '@shared/models/enumeration/date-format-type.enum';
import { IntervalModel } from '@shared/models/model/interval.model';

const FORMATS: Record<string, string> = {
	'global.date-and-time-format.date': 'yyyy-MM-dd',
	'global.date-and-time-format.time': 'HH:mm',
	'global.date-and-time-format.datetime': 'yyyy-MM-dd HH:mm',
};

function interval(
	years: number,
	months: number,
	days: number,
	hours: number,
	minutes: number,
	seconds: number,
): IntervalModel {
	return {
		yearCount: { value: years, label: 'year' },
		monthCount: { value: months, label: 'month' },
		dayCount: { value: days, label: 'day' },
		hourCount: { value: hours, label: 'hour' },
		minuteCount: { value: minutes, label: 'minute' },
		secondCount: { value: seconds, label: 'second' },
	};
}

describe('date pipes', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				DatePipe,
				DateFormatPipe,
				CustomDateFormatPipe,
				IntervalPipe,
				{
					provide: TranslocoService,
					useValue: {
						translate: (key: string, params?: Record<string, string>): string =>
							key in FORMATS ? FORMATS[key] : `${key}${params ? JSON.stringify(params) : ''}`,
					},
				},
				{
					provide: PluralTranslationPipe,
					useValue: { transform: (key: string, count: number): string => `${key}:${count}` },
				},
			],
		});
	});

	describe('DateFormatPipe', () => {
		it('formats a date with the translated pattern of the requested type', () => {
			// Arrange
			const pipe = TestBed.inject(DateFormatPipe);
			const date = new Date(2026, 0, 5, 10, 30);

			// Act
			const result = pipe.transform(date, DateFormatTypeEnum.DATETIME);

			// Assert
			expect(result).toBe('2026-01-05 10:30');
		});

		it('has nothing to show for an empty value', () => {
			// Arrange
			const pipe = TestBed.inject(DateFormatPipe);

			// Act
			const result = pipe.transform(undefined, DateFormatTypeEnum.DATE);

			// Assert
			expect(result).toBeUndefined();
		});
	});

	describe('CustomDateFormatPipe', () => {
		it.each([
			{
				name: 'only the date when there is no time',
				value: { date: '2026-01-05', time: undefined },
				expected: /^\d{4}-\d{2}-\d{2}$/,
			},
			{
				name: 'only the time when there is no date',
				value: { date: undefined, time: '10:00:00' },
				expected: /^\d{2}:\d{2}$/,
			},
			{
				name: 'both when both are set',
				value: { date: '2026-01-05', time: '10:00:00' },
				expected: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,
			},
		])('shows $name', ({ value, expected }) => {
			// Arrange
			const pipe = TestBed.inject(CustomDateFormatPipe);

			// Act
			const shown = pipe.transform(value);

			// Assert
			expect(shown).toMatch(expected);
		});

		it('is re-evaluated on every change detection so that a language change updates the text', () => {
			// Arrange
			const definition = (CustomDateFormatPipe as unknown as { ɵpipe: { pure: boolean } }).ɵpipe;

			// Act
			const pure = definition.pure;

			// Assert
			expect(pure).toBe(false);
		});

		it('has nothing to show when the pattern cannot format the date', () => {
			// Arrange
			const pipe = TestBed.inject(CustomDateFormatPipe);
			const invalid = TestBed.inject(DatePipe);
			vi.spyOn(invalid, 'transform').mockReturnValue(null);

			// Act
			const result = pipe.transform({ date: '2026-01-05', time: '10:00:00' });

			// Assert
			expect(result).toBeUndefined();
		});

		it('has nothing to show for an empty value', () => {
			// Arrange
			const pipe = TestBed.inject(CustomDateFormatPipe);

			// Act
			const result = pipe.transform(null);

			// Assert
			expect(result).toBeUndefined();
		});
	});

	describe('IntervalPipe', () => {
		let pipe: IntervalPipe;

		beforeEach(() => {
			pipe = TestBed.inject(IntervalPipe);
		});

		it.each([
			{ name: 'without an interval', value: undefined },
			{ name: 'for a zero span', value: interval(0, 0, 0, 0, 0, 0) },
		])('has nothing to show $name', ({ value }) => {
			// Arrange
			const span = value;

			// Act
			const shown = pipe.transform(span);

			// Assert
			expect(shown).toBeUndefined();
		});

		it('shows seconds as minutes and seconds under an hour', () => {
			// Arrange
			const span = interval(0, 0, 0, 0, 5, 7);

			// Act
			const result = pipe.transform(span);

			// Assert
			expect(result).toBe('05:07');
		});

		it('shows hours, minutes and seconds under a day', () => {
			// Arrange
			const span = interval(0, 0, 0, 3, 5, 7);

			// Act
			const result = pipe.transform(span);

			// Assert
			expect(result).toBe('03:05:07');
		});

		it('hides the seconds when asked, keeping hours and minutes', () => {
			// Arrange
			const span = interval(0, 0, 0, 3, 5, 7);

			// Act
			const result = pipe.transform(span, undefined, true);

			// Assert
			expect(result).toBe('03:05');
		});

		it('shows minutes as hours and minutes under an hour when seconds are hidden', () => {
			// Arrange
			const span = interval(0, 0, 0, 0, 5, 7);

			// Act
			const result = pipe.transform(span, undefined, true);

			// Assert
			expect(result).toBe('00:05');
		});

		it('says a few seconds under a minute when seconds are hidden', () => {
			// Arrange
			const spans = [interval(0, 0, 0, 0, 0, 0), interval(0, 0, 0, 0, 0, 42)];

			// Act
			const results = spans.map((span) => pipe.transform(span, undefined, true));

			// Assert
			expect(results).toEqual([
				'global.date-and-time-format.few-seconds',
				'global.date-and-time-format.few-seconds',
			]);
		});

		it('combines the two biggest non-zero units from the day up', () => {
			// Arrange
			const span = interval(1, 2, 3, 4, 5, 6);

			// Act
			const result = pipe.transform(span);

			// Assert
			expect(result).toContain('global.date-and-time-format.interval');
			expect(result).toContain('global.date-and-time-format.year');
			expect(result).toContain('global.date-and-time-format.month');
		});

		it('starts at months when there are no years', () => {
			// Arrange
			const span = interval(0, 2, 3, 0, 0, 0);

			// Act
			const result = pipe.transform(span);

			// Assert
			expect(result).toContain('global.date-and-time-format.month');
			expect(result).toContain('global.date-and-time-format.day');
		});

		it('starts at days when there are no months or years', () => {
			// Arrange
			const span = interval(0, 0, 3, 4, 0, 0);

			// Act
			const result = pipe.transform(span);

			// Assert
			expect(result).toContain('global.date-and-time-format.day');
			expect(result).toContain('global.date-and-time-format.hour');
		});
	});
});
