import { describe, expect, it } from 'vitest';

import { ErrorModel } from '@shared/models/model/error.model';
import { GenericModel } from '@shared/models/model/generic.model';

import { PageStateHelper } from './page-state.helper';

describe('PageStateHelper', () => {
	it('builds an idle initial block', () => {
		// Arrange
		const params = { a: 1 };

		// Act
		const block = PageStateHelper.initial<{ a: number }, GenericModel>(params);

		// Assert
		expect(block).toEqual({
			element: undefined,
			params: params,
			loading: false,
			silentLoading: false,
			error: undefined,
		});
	});

	it('sets an error toast without touching the rest', () => {
		// Arrange
		const block = PageStateHelper.initial<object, GenericModel>({});
		const error = ErrorModel.of('T', 'M');

		// Act
		const result = PageStateHelper.withError(block, error);

		// Assert
		expect(result.error?.summary).toBe('T');
		expect(result.loading).toBe(false);
	});

	it('turns a backend error into the notification a section shows', () => {
		// Arrange
		const error = ErrorModel.of('T', 'M');

		// Act
		const notification = PageStateHelper.toNotification(error);

		// Assert
		expect(notification).toEqual(expect.objectContaining({ severity: 'error', summary: 'T', detail: 'M' }));
	});

	it('never shows the raw message of a local exception', () => {
		// Arrange
		const error = new TypeError('labels is not iterable') as unknown as ErrorModel;

		// Act
		const notification = PageStateHelper.toNotification(error);

		// Assert
		expect(notification).toEqual(expect.objectContaining({ summary: undefined, detail: undefined }));
	});
});
