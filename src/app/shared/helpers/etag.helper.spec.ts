import { describe, expect, it } from 'vitest';

import { ETagHelper } from '@shared/helpers/etag.helper';
import { GenericModel } from '@shared/models/model/generic.model';

describe('ETagHelper', () => {
	it('quotes the epoch milliseconds of the last edition', () => {
		// Arrange
		const element = {
			lastEdition: { dateTime: new Date('2026-10-13T10:02:11.123456Z'), user: undefined },
		} as GenericModel;

		// Act
		const ifMatch = ETagHelper.ifMatch(element);

		// Assert
		expect(ifMatch).toBe('"1791885731123"');
	});

	it('accepts the date-time as the text received from the backend', () => {
		// Arrange
		const element = {
			lastEdition: { dateTime: '2026-10-13T10:02:11.123456Z', user: undefined },
		} as unknown as GenericModel;

		// Act
		const ifMatch = ETagHelper.ifMatch(element);

		// Assert
		expect(ifMatch).toBe('"1791885731123"');
	});

	it.each([
		{ name: 'an element without last edition', element: {} as GenericModel },
		{ name: 'no element', element: undefined },
	])('has no precondition for $name', ({ element }) => {
		// Arrange
		const source: GenericModel | undefined = element;

		// Act
		const result = ETagHelper.ifMatch(source);

		// Assert
		expect(result).toBeUndefined();
	});

	it.each([
		{
			name: 'turns a precondition into an If-Match header',
			ifMatch: '"1"',
			expected: { headers: { 'If-Match': '"1"' } },
		},
		{ name: 'adds no header without precondition', ifMatch: undefined, expected: {} },
	])('$name', ({ ifMatch, expected }) => {
		// Arrange
		const precondition: string | undefined = ifMatch;

		// Act
		const options = ETagHelper.options(precondition);

		// Assert
		expect(options).toEqual(expected);
	});
});
