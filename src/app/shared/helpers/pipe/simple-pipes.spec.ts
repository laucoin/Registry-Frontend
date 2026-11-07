import { describe, expect, it } from 'vitest';

import { FormButtonPipe } from '@shared/helpers/pipe/form-button.pipe';
import { FormTitlePipe } from '@shared/helpers/pipe/form-title.pipe';
import { ProjectOptionIconPipe } from '@shared/helpers/pipe/project-option-icon.pipe';
import { TruncatePipe } from '@shared/helpers/pipe/truncate.pipe';
import { VisibilityNamePipe } from '@shared/helpers/pipe/visibility.pipe';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { GenericModel } from '@shared/models/model/generic.model';

describe('FormButtonPipe', () => {
	it('offers to edit an existing element and to create a new one', () => {
		// Arrange
		const pipe = new FormButtonPipe();

		// Act
		const editing = pipe.transform({ id: '1' });
		const creating = pipe.transform(undefined);

		// Assert
		expect(editing).toBe('global.actions.edit');
		expect(creating).toBe('global.actions.create');
	});
});

describe('FormTitlePipe', () => {
	it('suffixes the title key with edit or create', () => {
		// Arrange
		const pipe = new FormTitlePipe();

		// Act
		const editing = pipe.transform('groups.form.title', { id: '1' });
		const creating = pipe.transform('groups.form.title', undefined);

		// Assert
		expect(editing).toBe('groups.form.title.edit');
		expect(creating).toBe('groups.form.title.create');
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
		const pipe = new ProjectOptionIconPipe();

		// Act
		const result = pipe.transform(option);

		// Assert
		expect(result).toBe(icon);
	});

	it('gives an unknown option no icon', () => {
		// Arrange
		const pipe = new ProjectOptionIconPipe();

		// Act
		const result = pipe.transform('UNKNOWN' as ProjectOptionEnum);

		// Assert
		expect(result).toBe('');
	});
});

describe('TruncatePipe', () => {
	it('cuts long text with a trail and keeps short text', () => {
		// Arrange
		const pipe = new TruncatePipe();

		// Act
		const cut = pipe.transform('a very long sentence indeed', 6);
		const kept = pipe.transform('short', 6);

		// Assert
		expect(cut).toBe('a very…');
		expect(kept).toBe('short');
	});

	it('uses twenty characters and an ellipsis by default', () => {
		// Arrange
		const pipe = new TruncatePipe();
		const text = 'x'.repeat(30);

		// Act
		const result = pipe.transform(text);

		// Assert
		expect(result).toBe('x'.repeat(20) + '…');
	});
});

describe('VisibilityNamePipe', () => {
	it('names the visible state with an optional prefix', () => {
		// Arrange
		const pipe = new VisibilityNamePipe<GenericModel>();

		// Act
		const visible = pipe.transform({ visible: true } as GenericModel, 'groups');
		const hidden = pipe.transform({ visible: false } as GenericModel, undefined);
		const missing = pipe.transform(undefined, 'groups');

		// Assert
		expect(visible).toBe('groups.visible.true');
		expect(hidden).toBe('visible.false');
		expect(missing).toBe('groups.visible.false');
	});
});
