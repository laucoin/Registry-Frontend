import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { describe, expect, it } from 'vitest';

import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe';
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe';
import { VisibilityNamePipe } from '@shared/helpers/pipe/visibility.pipe';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { GenericModel } from '@shared/models/model/generic.model';

function providedPipe<T>(pipe: Type<T>): T {
	return TestBed.configureTestingModule({ providers: [pipe] }).inject(pipe);
}

describe('FormButtonPipe', () => {
	it.each([
		{ name: 'offers to edit an existing element', element: { id: '1' }, expected: 'global.actions.edit' },
		{ name: 'offers to create a new one', element: undefined, expected: 'global.actions.create' },
	])('$name', ({ element, expected }) => {
		// Arrange
		const pipe = providedPipe(FormButtonPipe);

		// Act
		const label = pipe.transform(element);

		// Assert
		expect(label).toBe(expected);
	});
});

describe('FormTitlePipe', () => {
	it.each([
		{ name: 'edit for an existing element', element: { id: '1' }, expected: 'groups.form.title.edit' },
		{ name: 'create for a new one', element: undefined, expected: 'groups.form.title.create' },
	])('suffixes the title key with $name', ({ element, expected }) => {
		// Arrange
		const pipe = providedPipe(FormTitlePipe);

		// Act
		const key = pipe.transform('groups.form.title', element);

		// Assert
		expect(key).toBe(expected);
	});
});

describe('ProjectOptionIconPipe', () => {
	it.each([
		[ProjectOptionEnum.VEHICLE, 'car'],
		[ProjectOptionEnum.ACTIVITY, 'hammer'],
		[ProjectOptionEnum.COMMUNICATION, 'comment'],
		[ProjectOptionEnum.ALERT, 'triangle-exclamation'],
	])('gives the %s option its icon', (option, icon) => {
		// Arrange
		const pipe = providedPipe(ProjectOptionIconPipe);

		// Act
		const result = pipe.transform(option);

		// Assert
		expect(result).toBe(icon);
	});

	it('gives an unknown option no icon', () => {
		// Arrange
		const pipe = providedPipe(ProjectOptionIconPipe);

		// Act
		const result = pipe.transform('UNKNOWN' as ProjectOptionEnum);

		// Assert
		expect(result).toBe('');
	});
});

describe('TruncatePipe', () => {
	it.each([
		{ name: 'cuts long text with a trail', text: 'a very long sentence indeed', expected: 'a very…' },
		{ name: 'keeps short text', text: 'short', expected: 'short' },
	])('$name', ({ text, expected }) => {
		// Arrange
		const pipe = providedPipe(TruncatePipe);

		// Act
		const result = pipe.transform(text, 6);

		// Assert
		expect(result).toBe(expected);
	});

	it('uses twenty characters and an ellipsis by default', () => {
		// Arrange
		const pipe = providedPipe(TruncatePipe);
		const text = 'x'.repeat(30);

		// Act
		const result = pipe.transform(text);

		// Assert
		expect(result).toBe('x'.repeat(20) + '…');
	});
});

describe('VisibilityNamePipe', () => {
	it.each([
		{
			name: 'a visible element with a prefix',
			element: { visible: true } as GenericModel,
			prefix: 'groups',
			expected: 'groups.visible.true',
		},
		{
			name: 'a hidden element without prefix',
			element: { visible: false } as GenericModel,
			prefix: undefined,
			expected: 'visible.false',
		},
		{ name: 'a missing element as hidden', element: undefined, prefix: 'groups', expected: 'groups.visible.false' },
	])('names the visibility of $name', ({ element, prefix, expected }) => {
		// Arrange
		const pipe = new VisibilityNamePipe<GenericModel>();

		// Act
		const name = pipe.transform(element, prefix);

		// Assert
		expect(name).toBe(expected);
	});
});
