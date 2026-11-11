import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { backendError } from '@shared/helpers/testing/test-fixtures';
import { ErrorModel } from '@shared/models/model/error.model';
import { FormErrorComponent } from '@shared/ui/common/form-error/form-error.component';
import { FormErrorHarness } from '@shared/ui/common/form-error/testing/form-error.harness';

describe('FormErrorComponent', () => {
	async function create(error: ErrorModel | undefined): Promise<FormErrorHarness> {
		const fixture = TestBed.createComponent(FormErrorComponent);
		fixture.componentRef.setInput('error', error);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, FormErrorHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('shows nothing without error', async () => {
		// Arrange
		const error = undefined;

		// Act
		const harness = await create(error);

		// Assert
		expect(await harness.shown()).toBe(false);
	});

	it.each([
		{
			name: 'shows the title and the message of a backend error',
			error: backendError(409, 'Conflict', 'Already used'),
			title: 'fr.Conflict',
			text: 'fr.Already used',
		},
		{
			name: 'falls back on the generic title when the backend error has none',
			error: new ErrorModel(new HttpErrorResponse({ status: 500, error: { detail: 'Broken' } })),
			title: 'fr.global.notifications.UNKNOWN_ERROR.title',
			text: 'fr.Broken',
		},
		{
			name: 'never shows the raw message of a local exception',
			error: new TypeError('labels is not iterable') as unknown as ErrorModel,
			title: 'fr.global.notifications.UNKNOWN_ERROR.title',
			text: 'fr.global.notifications.UNKNOWN_ERROR.message',
		},
	])('$name', async ({ error, title, text }) => {
		// Arrange
		const failure = error;

		// Act
		const harness = await create(failure);

		// Assert
		expect(await harness.title()).toBe(title);
		expect(await harness.text()).toBe(text);
	});
});
