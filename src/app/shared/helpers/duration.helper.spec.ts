import { describe, expect, it } from 'vitest';

import { DurationHelper } from '@shared/helpers/duration.helper';

describe('DurationHelper', () => {
	it.each([
		[0, 'PT0S'],
		[45, 'PT45S'],
		[59.6, 'PT1M'],
		[60, 'PT1M'],
		[8100, 'PT2H15M'],
		[8110, 'PT2H15M'],
		[3600, 'PT1H'],
		[86400, 'P1D'],
		[90000, 'P1DT1H'],
		[-5, 'PT0S'],
	])('writes %s seconds as the ISO duration %s', (seconds, expected) => {
		// Arrange

		// Act
		const iso = DurationHelper.toIsoDuration(seconds);

		// Assert
		expect(iso).toBe(expected);
	});

	it.each([
		[0, 'PT0S'],
		[45, 'PT45S'],
		[8100, 'PT2H15M'],
		[86400, 'PT24H'],
		[2203200, 'PT612H'],
		[2203500, 'PT612H5M'],
		[90, 'PT2M'],
	])('writes %s seconds in hours and minutes as the ISO duration %s', (seconds, expected) => {
		// Arrange

		// Act
		const iso = DurationHelper.toIsoHours(seconds);

		// Assert
		expect(iso).toBe(expected);
	});
});
