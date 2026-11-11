import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { defined } from '@shared/helpers/testing/defined';
import { backendError } from '@shared/helpers/testing/test-fixtures';
import { ErrorModel } from '@shared/models/model/error.model';
import { FormDialogComponent } from '@shared/ui/common/form-dialog/form-dialog.component';
import { FormDialogHarness } from '@shared/ui/common/form-dialog/testing/form-dialog.harness';

@Component({
	selector: 'app-form-dialog-host',
	imports: [FormDialogComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './form-dialog.component.spec.html',
})
class HostComponent {
	public readonly title: WritableSignal<string | undefined> = signal('Edit');
	public readonly loading = signal(false);
	public readonly saving = signal(false);
	public readonly error: WritableSignal<ErrorModel | undefined> = signal(undefined);
	public submits = 0;
	public closes = 0;
}

describe('FormDialogComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let host: HostComponent;

	async function harnesses(): Promise<{ dialog: FormDialogHarness }> {
		return { dialog: await TestbedHarnessEnvironment.loader(fixture).getHarness(FormDialogHarness) };
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
		fixture = TestBed.createComponent(HostComponent);
		host = fixture.componentInstance;
	});

	it('puts the dialog inside a form so that the submit button and Enter submit it', async () => {
		// Arrange
		const { dialog } = await harnesses();

		// Act
		const placement = [await dialog.insideForm(), await dialog.submitSubmits(), await dialog.title()];

		// Assert
		expect(placement).toEqual([true, true, 'Edit']);
	});

	it('leaves the dialog without title when the page gives none', async () => {
		// Arrange
		host.title.set(undefined);

		// Act
		const { dialog } = await harnesses();

		// Assert
		expect(await dialog.title()).toBe('');
	});

	it('asks the page to submit when the form is submitted', async () => {
		// Arrange
		const { dialog } = await harnesses();

		// Act
		await dialog.submit();

		// Assert
		expect(host.submits).toBe(1);
	});

	it.each([
		{ name: 'the cancel button', act: (dialog: FormDialogHarness): Promise<void> => dialog.cancel() },
		{ name: 'the dialog itself', act: (dialog: FormDialogHarness): Promise<void> => dialog.hide() },
	])('asks the page to close from $name', async ({ act }) => {
		// Arrange
		const { dialog } = await harnesses();

		// Act
		await act(dialog);

		// Assert
		expect(host.closes).toBe(1);
	});

	it('stays open when a field inside the dialog hides its own panel', async () => {
		// Arrange
		await harnesses();
		const innerField: HTMLElement = fixture.nativeElement.querySelector('.inner-field');

		// Act
		innerField.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

		// Assert
		expect(host.closes).toBe(0);
	});

	it('shows a spinner instead of the fields while loading and disables the submit button', async () => {
		// Arrange
		host.loading.set(true);

		// Act
		const { dialog } = await harnesses();

		// Assert
		expect(await dialog.loading()).toBe(true);
		expect(await dialog.submitDisabled()).toBe(true);
	});

	it('shows the saving state of the submit button and the error of the submission', async () => {
		// Arrange
		host.saving.set(true);
		host.error.set(backendError(422, 'Invalid', 'Name already used'));

		// Act
		const { dialog } = await harnesses();

		// Assert
		expect(await dialog.saving()).toBe(true);
		expect(await defined(await dialog.error()).text()).toBe('fr.Name already used');
	});
});
