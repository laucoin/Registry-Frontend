import { convertToParamMap } from '@angular/router';

import { describe, expect, it } from 'vitest';

import { DEFAULT_SORT, formatSort, parseSort, SortFields, sortQueryCodec } from '@shared/helpers/search/sort-query';
import { SortDirectionEnum } from '@shared/models/enumeration/sort-direction.enum';

const ALLOWED: readonly string[] = ['name', 'begin'];

describe('sort query', () => {
	it.each<[string | null, SortFields]>([
		['name', { sortBy: 'name', sortDirection: SortDirectionEnum.ASC }],
		['-begin', { sortBy: 'begin', sortDirection: SortDirectionEnum.DESC }],
		['other', DEFAULT_SORT],
		['-other', DEFAULT_SORT],
		['', DEFAULT_SORT],
		[null, DEFAULT_SORT],
	])('reads the sort "%s" from the url', (raw, expected) => {
		// Arrange
		// Act
		const sort = parseSort(raw, ALLOWED);

		// Assert
		expect(sort).toEqual(expected);
	});

	it.each<[SortFields, string | undefined]>([
		[{ sortBy: 'name', sortDirection: SortDirectionEnum.ASC }, 'name'],
		[{ sortBy: 'name', sortDirection: SortDirectionEnum.DESC }, '-name'],
		[{ sortBy: '', sortDirection: SortDirectionEnum.DESC }, undefined],
	])('writes %j as the backend sort', (fields, expected) => {
		// Arrange
		// Act
		const sort = formatSort(fields);

		// Assert
		expect(sort).toBe(expected);
	});

	it('carries the sort of the model through the sort query param', () => {
		// Arrange
		const codec = sortQueryCodec<SortFields>(ALLOWED);

		// Act
		const read = codec.read(convertToParamMap({ sort: '-name' }), DEFAULT_SORT);

		// Assert
		expect(read).toEqual({ sortBy: 'name', sortDirection: SortDirectionEnum.DESC });
		expect(codec.write(read)).toEqual({ sort: '-name' });
		expect(codec.write(DEFAULT_SORT)).toEqual({ sort: null });
	});
});
