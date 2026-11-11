import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { BooleanChoice } from '@shared/helpers/form/boolean-choice';
import {
	injectSearchQuery,
	parseSearchQuery,
	SearchQuery,
	SearchQuerySchema,
	serializeSearchQuery,
} from '@shared/helpers/search/search-query';
import { SearchQueryFieldKindEnum } from '@shared/models/enumeration/search-query-field-kind.enum';

interface TestModel {
	q: string;
	at: Date | null;
	isFavorite: BooleanChoice;
}

const schema: SearchQuerySchema<TestModel> = {
	q: SearchQueryFieldKindEnum.TEXT,
	at: SearchQueryFieldKindEnum.DATE,
	isFavorite: SearchQueryFieldKindEnum.CHOICE,
};
const defaults: TestModel = { q: '', at: null, isFavorite: '' };

describe('search query', () => {
	it('reads every field of the schema from the url', () => {
		// Arrange
		const query = convertToParamMap({
			q: 'camp',
			at: '2026-01-02T00:00:00.000Z',
			isFavorite: 'true',
			other: 'x',
		});

		// Act
		const model: TestModel = parseSearchQuery(schema, defaults, query);

		// Assert
		expect(model).toEqual({ q: 'camp', at: new Date('2026-01-02T00:00:00.000Z'), isFavorite: 'true' });
	});

	it('falls back to the defaults for absent or invalid values', () => {
		// Arrange
		const query = convertToParamMap({ at: 'not-a-date', isFavorite: 'maybe' });

		// Act
		const model: TestModel = parseSearchQuery(schema, defaults, query);

		// Assert
		expect(model).toEqual(defaults);
	});

	it('removes the fields equal to their default from the url', () => {
		// Arrange
		const model: TestModel = { q: 'camp', at: null, isFavorite: 'false' };

		// Act
		const params = serializeSearchQuery(schema, defaults, model);

		// Assert
		expect(params).toEqual({ q: 'camp', at: null, isFavorite: 'false' });
		expect(serializeSearchQuery(schema, defaults, defaults)).toEqual({ q: null, at: null, isFavorite: null });
	});

	it('writes a date as an ISO string', () => {
		// Arrange
		const model: TestModel = { ...defaults, at: new Date('2026-01-02T00:00:00.000Z') };

		// Act
		const params = serializeSearchQuery(schema, defaults, model);

		// Assert
		expect(params['at']).toBe('2026-01-02T00:00:00.000Z');
	});

	it('leaves out of the url a field the schema declares without kind', () => {
		// Arrange
		const partial: SearchQuerySchema<TestModel> = { q: SearchQueryFieldKindEnum.TEXT, at: undefined };

		// Act
		const params = serializeSearchQuery(partial, defaults, { ...defaults, q: 'camp' });

		// Assert
		expect(params).toEqual({ q: 'camp' });
	});

	it('treats a missing text as its empty default', () => {
		// Arrange
		const model = { ...defaults, q: undefined as unknown as string };

		// Act
		const params = serializeSearchQuery(schema, defaults, model);

		// Assert
		expect(params['q']).toBeNull();
	});

	it('only accepts the values listed by an enumerated field', () => {
		// Arrange
		const listed: SearchQuerySchema<TestModel> = { q: ['camp', 'raid'] };

		// Act
		const accepted: TestModel = parseSearchQuery(listed, defaults, convertToParamMap({ q: 'raid' }));
		const rejected: TestModel = parseSearchQuery(listed, defaults, convertToParamMap({ q: 'other' }));

		// Assert
		expect(accepted.q).toBe('raid');
		expect(rejected.q).toBe('');
	});

	describe('automatic search', () => {
		interface AutoModel {
			q: string;
			type: string;
		}

		const autoDefaults: AutoModel = { q: '', type: '' };
		const autoSchema: SearchQuerySchema<AutoModel> = {
			q: SearchQueryFieldKindEnum.TEXT,
			type: SearchQueryFieldKindEnum.TEXT,
		};
		let model: WritableSignal<AutoModel>;
		let search: Mock<(model: AutoModel) => void>;
		let apply: Mock<() => void>;
		let queryParamMap$: BehaviorSubject<ParamMap>;
		let navigate: Mock<() => Promise<boolean>>;
		let searchQuery: SearchQuery<AutoModel>;

		function create(): void {
			const queryParamMap = convertToParamMap({});
			queryParamMap$ = new BehaviorSubject(queryParamMap);
			apply = vi.fn();
			navigate = vi.fn(() => Promise.resolve(true));
			search = vi.fn();
			TestBed.configureTestingModule({
				providers: [
					{
						provide: ActivatedRoute,
						useValue: { snapshot: { queryParamMap }, queryParamMap: queryParamMap$ },
					},
					{ provide: Router, useValue: { navigate } },
				],
			});
			model = signal(autoDefaults);
			searchQuery = TestBed.runInInjectionContext(() =>
				injectSearchQuery({
					schema: autoSchema,
					defaults: autoDefaults,
					model,
					apply,
					search: (searched) => {
						search(searched);
						searchQuery.write(searched);
					},
				}),
			);
			TestBed.tick();
		}

		function change(value: AutoModel, wait = 400): void {
			model.set(value);
			TestBed.tick();
			vi.advanceTimersByTime(wait);
		}

		beforeEach(() => {
			vi.useFakeTimers();
			RegistryConfig.config = { list: { searchDebounce: 400, searchMinLength: 3 } } as unknown as ConfigModel;
			create();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('searches once the debounce has elapsed after a change', () => {
			// Arrange
			const value: AutoModel = { q: '', type: 'MOVE' };

			// Act
			change(value, 399);
			const before = search.mock.calls.length;
			vi.advanceTimersByTime(1);

			// Assert
			expect(before).toBe(0);
			expect(search).toHaveBeenCalledTimes(1);
		});

		it('ignores a text shorter than the minimum length', () => {
			// Arrange
			const value: AutoModel = { q: 'ab', type: '' };

			// Act
			change(value);

			// Assert
			expect(search).not.toHaveBeenCalled();
		});

		it('searches when the text reaches the minimum length and when it is cleared', () => {
			// Arrange
			const typed: AutoModel = { q: 'abc', type: '' };

			// Act
			change(typed);
			change(autoDefaults);

			// Assert
			expect(search).toHaveBeenCalledTimes(2);
		});

		it('searches immediately on submit and not again after the debounce', () => {
			// Arrange
			model.set({ q: 'ab', type: '' });

			// Act
			searchQuery.submit();
			vi.advanceTimersByTime(400);

			// Assert
			expect(search).toHaveBeenCalledTimes(1);
		});

		it('does not search on submit when nothing changed', () => {
			// Arrange
			const unchanged: AutoModel = { ...autoDefaults };

			// Act
			model.set(unchanged);
			searchQuery.submit();

			// Assert
			expect(search).not.toHaveBeenCalled();
		});

		it('searches again each time the values differ from the last applied search', () => {
			// Arrange
			const value: AutoModel = { q: '', type: 'MOVE' };

			// Act
			change(value);
			change(autoDefaults);
			change(value);

			// Assert
			expect(search).toHaveBeenCalledTimes(3);
			expect(navigate).toHaveBeenCalledTimes(3);
		});

		it('keeps the applied text when another field changes while the text is too short', () => {
			// Arrange
			change({ q: 'abc', type: '' });

			// Act
			change({ q: 'ab', type: 'MOVE' });

			// Assert
			expect(search).toHaveBeenLastCalledWith({ q: 'abc', type: 'MOVE' });
			expect(model().q).toBe('ab');
		});

		it('searches with the short text when the search is forced', () => {
			// Arrange
			model.set({ q: 'ab', type: 'MOVE' });

			// Act
			searchQuery.submit();

			// Assert
			expect(search).toHaveBeenCalledWith({ q: 'ab', type: 'MOVE' });
			expect(navigate).toHaveBeenCalledWith(
				[],
				expect.objectContaining({ queryParams: { q: 'ab', type: 'MOVE' } }),
			);
		});

		it('keeps the typed text when the url echoes the applied search', () => {
			// Arrange
			change({ q: 'abc', type: '' });
			model.set({ q: 'ab', type: 'MOVE' });
			vi.advanceTimersByTime(400);

			// Act
			queryParamMap$.next(convertToParamMap({ q: 'abc', type: 'MOVE' }));
			TestBed.tick();

			// Assert
			expect(model().q).toBe('ab');
			expect(apply).toHaveBeenCalledTimes(1);
		});

		it('aligns the form on an external url change without searching again', () => {
			// Arrange
			const external = convertToParamMap({ q: 'raid', type: 'MOVE' });

			// Act
			queryParamMap$.next(external);
			TestBed.tick();
			vi.advanceTimersByTime(400);

			// Assert
			expect(model()).toEqual({ q: 'raid', type: 'MOVE' });
			expect(apply).toHaveBeenLastCalledWith({ q: 'raid', type: 'MOVE' }, false);
			expect(search).not.toHaveBeenCalled();
		});

		it('aligns the form as soon as the url changes, without waiting for change detection', () => {
			// Arrange
			const external = convertToParamMap({ q: 'raid', type: 'MOVE' });

			// Act
			queryParamMap$.next(external);

			// Assert
			expect(model()).toEqual({ q: 'raid', type: 'MOVE' });
		});

		it('does not search when the values cannot be serialized', () => {
			// Arrange
			const invalid = new Date(Number.NaN);
			TestBed.resetTestingModule();
			const dateModel = signal({ at: new Date(0) });
			const dateSearch: Mock<() => void> = vi.fn();
			TestBed.configureTestingModule({
				providers: [
					{
						provide: ActivatedRoute,
						useValue: {
							snapshot: { queryParamMap: convertToParamMap({}) },
							queryParamMap: new BehaviorSubject(convertToParamMap({})),
						},
					},
					{ provide: Router, useValue: { navigate } },
				],
			});
			const created: SearchQuery = TestBed.runInInjectionContext(() =>
				injectSearchQuery({
					schema: { at: SearchQueryFieldKindEnum.DATE },
					defaults: { at: new Date(0) },
					model: dateModel,
					apply: vi.fn(),
					search: dateSearch,
				}),
			);

			// Act
			dateModel.set({ at: invalid });
			created.submit();

			// Assert
			expect(dateSearch).not.toHaveBeenCalled();
		});

		it('falls back to the default list settings without runtime configuration', () => {
			// Arrange
			RegistryConfig.config = undefined as unknown as ConfigModel;
			TestBed.resetTestingModule();
			create();

			// Act
			change({ q: 'ab', type: '' });
			change({ q: 'abc', type: '' });

			// Assert
			expect(search).toHaveBeenCalledTimes(1);
		});
	});
});
