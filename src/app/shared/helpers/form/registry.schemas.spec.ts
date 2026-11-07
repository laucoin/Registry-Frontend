import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FieldTree, form, SchemaPath, SchemaPathTree } from '@angular/forms/signals';

import { describe, expect, it } from 'vitest';

import { RegistrySchemas } from '@shared/helpers/form/registry.schemas';
import { defined } from '@shared/helpers/testing/defined';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { NumericRangeModel } from '@shared/models/model/numeric-range.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' };
const JULY: CustomDatetimeModel = { date: '2026-07-01', time: '10:00:00' };
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' };

function errorsOf<T>(model: T, rule: (path: SchemaPathTree<T>) => void): object[] {
	const tree: FieldTree<T> = TestBed.runInInjectionContext(() => form(signal(model) as WritableSignal<T>, rule));
	return tree()
		.errors()
		.map((error): object => ({ ...error, fieldTree: undefined }));
}

describe('RegistrySchemas', () => {
	it.each([
		['   ', [{ kind: 'blank' }]],
		['', [{ kind: 'blank' }]],
		['text', []],
	])('nonBlank judges %j as %j', (value, expected: object[]) => {
		// Arrange
		const rule = RegistrySchemas.nonBlank;

		// Act
		const errors = errorsOf(value, rule);

		// Assert
		expect(errors).toEqual(expected);
	});

	it.each([
		['   ', [{ kind: 'blank' }]],
		['', []],
		['text', []],
	])('nonBlankIfFilled judges %j as %j', (value, expected: object[]) => {
		// Arrange
		const rule = RegistrySchemas.nonBlankIfFilled;

		// Act
		const errors = errorsOf(value, rule);

		// Assert
		expect(errors).toEqual(expected);
	});

	it('withinProject refuses a date outside the project bounds and formats the bound', () => {
		// Arrange
		const project = { begin: JUNE, end: AUGUST } as ProjectModel;
		const rule = (path: SchemaPath<CustomDatetimeModel | null>): void =>
			RegistrySchemas.withinProject(
				path,
				() => project,
				(date) => `<${date.date}>`,
			);
		const tooEarly: CustomDatetimeModel = { date: '2026-05-01', time: '10:00:00' };
		const tooLate: CustomDatetimeModel = { date: '2026-09-01', time: '10:00:00' };

		// Act
		const errors = [tooEarly, tooLate, JULY, null].flatMap((value: CustomDatetimeModel | null) =>
			errorsOf(value, rule),
		);

		// Assert
		expect(errors).toEqual([
			{ kind: 'minDate', min: '<2026-06-01>' },
			{ kind: 'maxDate', max: '<2026-08-01>' },
		]);
	});

	it('withinProject accepts a native date and follows a project that changes', () => {
		// Arrange
		const project: WritableSignal<ProjectModel | undefined> = signal(undefined);
		const rule = (path: SchemaPath<Date | null>): void =>
			RegistrySchemas.withinProject(path, project, () => 'bound');
		const date = new Date(2026, 4, 1, 10);

		// Act
		const withoutProject = errorsOf(date, rule);
		project.set({ begin: JUNE } as ProjectModel);

		// Assert
		expect([withoutProject, errorsOf(date, rule)]).toEqual([[], [{ kind: 'minDate', min: 'bound' }]]);
	});

	it.each([
		[{ date: undefined, time: '10:00:00' }, [{ kind: 'dateRequiredForTime' }]],
		[{ date: '2026-06-01', time: undefined }, []],
		[null, []],
	])('dateRequiredForTime judges %j as %j', (value: unknown, expected: object[]) => {
		// Arrange
		const rule = RegistrySchemas.dateRequiredForTime;

		// Act
		const errors = errorsOf(value as CustomDatetimeModel | null, rule);

		// Assert
		expect(errors).toEqual(expected);
	});

	it.each([
		[{ lower: 5, upper: 2 }, [{ kind: 'rangeMin', min: 5, actual: 2 }]],
		[{ lower: 2, upper: 5 }, []],
		[{ lower: 2, upper: undefined }, []],
		[null, []],
	])('numericRange judges %j as %j', (value: unknown, expected: object[]) => {
		// Arrange
		const rule = RegistrySchemas.numericRange;

		// Act
		const errors = errorsOf(value as NumericRangeModel | null, rule);

		// Assert
		expect(errors).toEqual(expected);
	});

	it('numericRangeMin and numericRangeMax refuse the out of bounds side only', () => {
		// Arrange
		const min = (path: SchemaPath<NumericRangeModel | null>): void => RegistrySchemas.numericRangeMin(path, 3);
		const max = (path: SchemaPath<NumericRangeModel | null>): void => RegistrySchemas.numericRangeMax(path, 8);
		const range: NumericRangeModel = { lower: 1, upper: 10 };

		// Act
		const errors = [...errorsOf(range, min), ...errorsOf(range, max), ...errorsOf(null, min)];

		// Assert
		expect(errors).toEqual([
			{ kind: 'min', min: 3, actual: 1 },
			{ kind: 'max', max: 8, actual: 10 },
		]);
	});

	it.each([
		[{ lower: 1, upper: undefined }, [{ kind: 'rangeBothDefined' }]],
		[{ lower: undefined, upper: 1 }, [{ kind: 'rangeBothDefined' }]],
		[{ lower: 1, upper: 2 }, []],
		[{ lower: undefined, upper: undefined }, []],
	])('numericRangeBothDefined judges %j as %j', (value: unknown, expected: object[]) => {
		// Arrange
		const rule = RegistrySchemas.numericRangeBothDefined;

		// Act
		const errors = errorsOf(value as NumericRangeModel | null, rule);

		// Assert
		expect(errors).toEqual(expected);
	});

	it.each([
		[JULY, JUNE, [{ kind: 'beginDateBeforeEndDate' }]],
		[JULY, JULY, [{ kind: 'beginDateBeforeEndDate' }]],
		[JUNE, JULY, []],
		[null, JULY, []],
	])(
		'beginDateBeforeEndDate judges %j then %j as %j',
		(beginDateTime: unknown, endDateTime: unknown, expected: object[]) => {
			// Arrange
			const model = {
				beginDateTime: beginDateTime as CustomDatetimeModel | null,
				endDateTime: endDateTime as CustomDatetimeModel | null,
			};

			// Act
			const tree: FieldTree<typeof model> = TestBed.runInInjectionContext(() =>
				form(signal(model), (path: SchemaPathTree<typeof model>) =>
					RegistrySchemas.beginDateBeforeEndDate(path.beginDateTime, path.endDateTime),
				),
			);
			const errors: object[] = tree
				.endDateTime()
				.errors()
				.map((error): object => ({ ...error, fieldTree: undefined }));

			// Assert
			expect(errors).toEqual(expected);
		},
	);

	it.each([
		[{ movement: undefined, alert: undefined }, [{ kind: 'atLeastOneRequired' }]],
		[{ movement: 'm', alert: undefined }, []],
		[{ movement: undefined, alert: 'a' }, []],
	])(
		'atLeastOneRequired judges %j as %j',
		(model: { movement: string | undefined; alert: string | undefined }, expected: object[]) => {
			// Arrange
			const rule = (path: SchemaPath<typeof model>): void =>
				RegistrySchemas.atLeastOneRequired(path, 'movement', 'alert');

			// Act
			const errors = errorsOf(model, rule);

			// Assert
			expect(errors).toEqual(expected);
		},
	);

	it('preRequiredOptions reports the first selected option missing its prerequisite', () => {
		// Arrange
		const options = [
			{
				value: 'ALERTS',
				label: 'Alerts',
				preRequired: [{ value: 'MOVEMENTS' as ProjectOptionEnum, label: 'Movements' }],
			} as unknown as ProjectOptionModel,
		];
		const rule = (path: SchemaPath<Record<string, boolean>>): void =>
			RegistrySchemas.preRequiredOptions(path, () => options);

		// Act
		const missing = errorsOf<Record<string, boolean>>({ ALERTS: true, MOVEMENTS: false }, rule);
		const satisfied = errorsOf<Record<string, boolean>>({ ALERTS: true, MOVEMENTS: true }, rule);

		// Assert
		expect([missing, satisfied]).toEqual([
			[{ kind: 'preRequiredOptions', for: 'Alerts', missing: 'Movements' }],
			[],
		]);
	});

	it('requiredText requires, limits and refuses blank texts', () => {
		// Arrange
		const rule = (path: SchemaPath<string>): void => RegistrySchemas.requiredText(path, 3);

		// Act
		const errors = ['', '  ', 'abcd', 'ok'].map((value) => errorsOf(value, rule));

		// Assert
		expect(errors).toEqual([
			[{ kind: 'required' }, { kind: 'blank' }],
			[{ kind: 'blank' }],
			[{ kind: 'maxLength', maxLength: 3 }],
			[],
		]);
	});

	it('projectDateTime combines the time without date rule and the project bounds', () => {
		// Arrange
		const project = { begin: JUNE } as ProjectModel;
		const rule = (path: SchemaPath<CustomDatetimeModel | null>): void =>
			RegistrySchemas.projectDateTime(path, {
				project: () => project,
				formatDate: (date) => defined(date.date),
			});

		// Act
		const errors = [{ date: undefined, time: '10:00:00' }, { date: '2026-01-01', time: '10:00:00' }, JULY].flatMap(
			(value: CustomDatetimeModel) => errorsOf(value, rule),
		);

		// Assert
		expect(errors.map((error): unknown => (error as { kind: string }).kind)).toEqual([
			'dateRequiredForTime',
			'minDate',
			'minDate',
		]);
	});

	it('requiredList refuses an empty list only', () => {
		// Arrange
		const rule = (path: SchemaPath<string[]>): void => RegistrySchemas.requiredList(path);

		// Act
		const errors = [[], ['a']].map((value) => errorsOf(value, rule));

		// Assert
		expect(errors).toEqual([[{ kind: 'required' }], []]);
	});

	it('requiredList ignores an empty list while its condition is not met', () => {
		// Arrange
		const rule = (path: SchemaPath<string[]>): void => RegistrySchemas.requiredList(path, (): boolean => false);

		// Act
		const errors = errorsOf([], rule);

		// Assert
		expect(errors).toEqual([]);
	});

	it('notInTheFuture refuses a date after now only', () => {
		// Arrange
		const now = new Date(2026, 5, 15);
		const rule = (path: SchemaPath<Date | null>): void => RegistrySchemas.notInTheFuture(path, () => now);

		// Act
		const errors = [new Date(2026, 5, 16), new Date(2026, 5, 15), new Date(2000, 0, 1), null].map((value) =>
			errorsOf(value, rule),
		);

		// Assert
		expect(errors).toEqual([[{ kind: 'maxDate', max: undefined }], [], [], []]);
	});

	it('notInTheFuture reports the given error kind', () => {
		// Arrange
		const now = new Date(2026, 5, 15);
		const rule = (path: SchemaPath<Date | null>): void => RegistrySchemas.notInTheFuture(path, () => now, 'future');

		// Act
		const errors = errorsOf(new Date(2026, 5, 16), rule);

		// Assert
		expect(errors).toEqual([{ kind: 'future', max: undefined }]);
	});
});
