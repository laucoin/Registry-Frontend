import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { describe, expect, it } from 'vitest';

import {
	createProjectForm,
	createProjectOptionsForm,
	ProjectFormModel,
	ProjectOptionsFormModel,
	selectedOptionsState,
	toProjectDto,
	toProjectFormModel,
	toProjectOptionsFormModel,
	withAllOptions,
} from '@pages/projects/project-form/project.form';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { CustomDatetimeModel } from '@shared/models/model/custom-datetime.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { ProjectOptionModel } from '@shared/models/model/project-option.model';

const JUNE: CustomDatetimeModel = { date: '2026-06-01', time: '10:00:00' };
const AUGUST: CustomDatetimeModel = { date: '2026-08-01', time: '10:00:00' };
const OPTIONS: ProjectOptionModel[] = [
	{ value: ProjectOptionEnum.ACTIVITY, label: 'Activity', ask: '', preRequired: [] },
	{
		value: ProjectOptionEnum.ALERT,
		label: 'Alert',
		ask: '',
		preRequired: [{ label: 'Activity', value: ProjectOptionEnum.ACTIVITY }],
	},
];

function kindsOf(field: { errors: () => readonly { kind: string }[] }): string[] {
	return field.errors().map((error) => error.kind);
}

describe('project form', () => {
	it.each([
		{
			name: 'maps no project to a blank form',
			project: undefined,
			expected: { name: '', beginDateTime: null, endDateTime: null },
		},
		{
			name: 'maps a project to its name and dates',
			project: { name: 'Camp', begin: JUNE, end: undefined } as ProjectModel,
			expected: { name: 'Camp', beginDateTime: JUNE, endDateTime: null },
		},
	])('$name', ({ project, expected }) => {
		// Arrange
		const source = project;

		// Act
		const model = toProjectFormModel(source);

		// Assert
		expect(model).toEqual(expected);
	});

	it('ticks the selected options among the available ones', () => {
		// Arrange
		const selected = [{ label: 'Alert', value: ProjectOptionEnum.ALERT }];

		// Act
		const options = toProjectOptionsFormModel(OPTIONS, selected);

		// Assert
		expect(options).toEqual({ ACTIVITY: false, ALERT: true });
	});

	it.each([
		[{ A: false, B: false }, false],
		[{ A: true, B: true }, true],
		[{ A: true, B: false }, undefined],
	])('judges the options %j as selected=%s', (options: ProjectOptionsFormModel, expected) => {
		// Arrange
		const model: ProjectOptionsFormModel = options;

		// Act
		const state = selectedOptionsState(model);

		// Assert
		expect(state).toBe(expected);
	});

	it('ticks or clears every option at once', () => {
		// Arrange
		const options: ProjectOptionsFormModel = { A: false, B: true };

		// Act
		const results = [withAllOptions(options, true), withAllOptions(options, false)];

		// Assert
		expect(results).toEqual([
			{ A: true, B: true },
			{ A: false, B: false },
		]);
	});

	it('builds the dto with the ticked options only', () => {
		// Arrange
		const model: ProjectFormModel = { name: 'Camp', beginDateTime: JUNE, endDateTime: null };

		// Act
		const dto: object = toProjectDto(model, { ACTIVITY: true, ALERT: false });

		// Assert
		expect(dto).toEqual({ name: 'Camp', begin: JUNE, end: undefined, options: ['ACTIVITY'] });
	});

	it('requires a name and an end after the beginning', () => {
		// Arrange
		const model: WritableSignal<ProjectFormModel> = signal({ name: '', beginDateTime: AUGUST, endDateTime: JUNE });
		const tree = TestBed.runInInjectionContext(() => createProjectForm(model));

		// Act
		const kinds = [kindsOf(tree.name()), kindsOf(tree.endDateTime())];

		// Assert
		expect(kinds).toEqual([['required', 'blank'], ['beginDateBeforeEndDate']]);
	});

	it('rejects an option whose prerequisite is not ticked', () => {
		// Arrange
		const model: WritableSignal<ProjectOptionsFormModel> = signal({ ACTIVITY: false, ALERT: true });
		const tree = TestBed.runInInjectionContext(() => createProjectOptionsForm(model, () => OPTIONS));

		// Act
		const before = kindsOf(tree());
		model.set({ ACTIVITY: true, ALERT: true });

		// Assert
		expect([before, kindsOf(tree())]).toEqual([['preRequiredOptions'], []]);
	});
});
