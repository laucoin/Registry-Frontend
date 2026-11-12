import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { Observable, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ConfirmationDialogComponent } from '@core/layout/confirmation-dialog/confirmation-dialog.component';
import { ConfirmationDialogHarness } from '@core/layout/confirmation-dialog/testing/confirmation-dialog.harness';
import { UiFacade } from '@core/registry/state/ui.facade';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ConfirmationModel } from '@shared/models/model/confirmation.model';
import { ErrorModel } from '@shared/models/model/error.model';

describe('ConfirmationDialogComponent', () => {
	let requests: Subject<ConfirmationModel>;
	let accept: Mock<() => Observable<unknown>>;

	const request = (acceptSeverity: SeverityEnum): ConfirmationModel => ({
		header: 'Delete',
		message: 'Sure?',
		acceptSeverity,
		accept,
	});

	let fixture: ComponentFixture<ConfirmationDialogComponent>;

	async function create(): Promise<ConfirmationDialogHarness> {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [{ provide: UiFacade, useValue: { confirmation: requests.asObservable() } }],
		});
		fixture = TestBed.createComponent(ConfirmationDialogComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ConfirmationDialogHarness);
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
		requests = new Subject<ConfirmationModel>();
		accept = vi.fn(() => of(undefined));
	});

	it('stays closed until a confirmation is requested, then shows it', async () => {
		// Arrange
		const dialog = await create();
		const before = await dialog.isOpen();

		// Act
		requests.next(request(SeverityEnum.DANGER));

		// Assert
		expect(before).toBe(false);
		expect(await dialog.isOpen()).toBe(true);
		expect(await dialog.title()).toBe('Delete');
		expect(await dialog.messageText()).toBe('Sure?');
	});

	it.each([
		[SeverityEnum.DANGER, 'danger'],
		[SeverityEnum.ERROR, 'danger'],
		[SeverityEnum.WARNING, 'warning'],
		[SeverityEnum.SUCCESS, 'success'],
		[SeverityEnum.INFO, 'info'],
		[SeverityEnum.PRIMARY, 'primary'],
	])('colors the dialog of a %s confirmation as %s', async (severity, expected) => {
		// Arrange
		const dialog = await create();

		// Act
		requests.next(request(severity));

		// Assert
		expect(await dialog.variant()).toBe(expected);
	});

	it('runs the command and closes when the user confirms', async () => {
		// Arrange
		const dialog = await create();
		requests.next(request(SeverityEnum.DANGER));

		// Act
		await dialog.confirm();

		// Assert
		expect(accept).toHaveBeenCalledTimes(1);
		expect(await dialog.title()).toBe('');
		expect(await dialog.messageText()).toBe('');
	});

	it('replaces the pending confirmation by a new one without running the first', async () => {
		// Arrange
		const dialog = await create();
		const first: Mock<() => Observable<unknown>> = vi.fn(() => of(undefined));
		requests.next({ ...request(SeverityEnum.DANGER), header: 'First', accept: first });

		// Act
		requests.next({ ...request(SeverityEnum.INFO), header: 'Second' });
		await dialog.confirm();

		// Assert
		expect(first).not.toHaveBeenCalled();
		expect(accept).toHaveBeenCalledTimes(1);
	});

	it('closes without running the command when the user cancels', async () => {
		// Arrange
		const dialog = await create();
		requests.next(request(SeverityEnum.DANGER));

		// Act
		await dialog.cancel();

		// Assert
		expect(accept).not.toHaveBeenCalled();
		expect(await dialog.title()).toBe('');
		expect(await dialog.messageText()).toBe('');
	});

	it('closes without running the command when the dialog is dismissed', async () => {
		// Arrange
		const dialog = await create();
		requests.next(request(SeverityEnum.DANGER));

		// Act
		await dialog.dismiss();

		// Assert
		expect(accept).not.toHaveBeenCalled();
		expect(await dialog.title()).toBe('');
		expect(await dialog.messageText()).toBe('');
	});

	it('needs no phrase to confirm a plain confirmation', async () => {
		// Arrange
		const dialog = await create();

		// Act
		requests.next(request(SeverityEnum.DANGER));

		// Assert
		expect(await dialog.asksForPhrase()).toBe(false);
		expect(await dialog.canConfirm()).toBe(true);
	});

	it('refuses to confirm a typed confirmation until its phrase is typed, whatever the case', async () => {
		// Arrange
		const dialog = await create();
		requests.next({ ...request(SeverityEnum.DANGER), phrase: 'delete mine' });
		const before = await dialog.canConfirm();

		// Act
		await dialog.confirm();
		const acceptedEarly = accept.mock.calls.length;
		await dialog.typePhrase('  Delete Mine ');
		await dialog.confirm();

		// Assert
		expect(before).toBe(false);
		expect(acceptedEarly).toBe(0);
		expect(accept).toHaveBeenCalledTimes(1);
		expect(await dialog.title()).toBe('');
		expect(await dialog.messageText()).toBe('');
	});

	it('forgets what was typed when the confirmation is replaced', async () => {
		// Arrange
		const dialog = await create();
		requests.next({ ...request(SeverityEnum.DANGER), phrase: 'delete mine' });
		await dialog.typePhrase('delete');

		// Act
		requests.next({ ...request(SeverityEnum.DANGER), phrase: 'delete mine' });

		// Assert
		expect(await dialog.typedPhrase()).toBe('');
		expect(await dialog.canConfirm()).toBe(false);
	});

	it('stays open when the hide event comes from an element nested in the dialog', async () => {
		// Arrange
		const dialog = await create();
		requests.next(request(SeverityEnum.DANGER));
		const host = fixture.debugElement.query(By.css(byTestId('confirmation-dialog')));

		// Act
		host.triggerEventHandler('sgdf-hide', { target: {}, currentTarget: host.nativeElement });

		// Assert
		expect(await dialog.title()).toBe('Delete');
	});

	it('shows the progress on the confirm button while the command runs, then closes once it succeeds', async () => {
		// Arrange
		const dialog = await create();
		const outcome = new Subject<void>();
		accept.mockReturnValue(outcome);
		requests.next(request(SeverityEnum.DANGER));

		// Act
		await dialog.confirm();
		const savingWhileRunning = await dialog.saving();
		const titleWhileRunning = await dialog.title();
		outcome.complete();

		// Assert
		expect(savingWhileRunning).toBe(true);
		expect(titleWhileRunning).toBe('Delete');
		expect(await dialog.saving()).toBe(false);
		expect(await dialog.title()).toBe('');
	});

	it('stays open with the message of the backend inside when the command fails', async () => {
		// Arrange
		const dialog = await create();
		const outcome = new Subject<void>();
		accept.mockReturnValue(outcome);
		requests.next(request(SeverityEnum.DANGER));

		// Act
		await dialog.confirm();
		outcome.error(new ErrorModel(new HttpErrorResponse({ status: 409, error: { detail: 'Still in use' } })));

		// Assert
		expect(await dialog.title()).toBe('Delete');
		expect(await dialog.saving()).toBe(false);
		expect(await dialog.errorText()).toContain('Still in use');
	});

	it('clears the failure when the command is sent again', async () => {
		// Arrange
		const dialog = await create();
		const failed = new Subject<void>();
		accept.mockReturnValueOnce(failed).mockReturnValueOnce(new Subject<void>());
		requests.next(request(SeverityEnum.DANGER));
		await dialog.confirm();
		failed.error(new ErrorModel(new HttpErrorResponse({ status: 409, error: { detail: 'Still in use' } })));

		// Act
		await dialog.confirm();

		// Assert
		expect(accept).toHaveBeenCalledTimes(2);
		expect(await dialog.errorShown()).toBe(false);
	});

	it('forgets the failure when the dialog is closed', async () => {
		// Arrange
		const dialog = await create();
		const failed = new Subject<void>();
		accept.mockReturnValueOnce(failed);
		requests.next(request(SeverityEnum.DANGER));
		await dialog.confirm();
		failed.error(new ErrorModel(new HttpErrorResponse({ status: 409, error: { detail: 'Still in use' } })));

		// Act
		await dialog.cancel();
		requests.next(request(SeverityEnum.DANGER));

		// Assert
		expect(await dialog.errorShown()).toBe(false);
	});

	it('cancels the running command when the dialog is closed', async () => {
		// Arrange
		const dialog = await create();
		const outcome = new Subject<void>();
		accept.mockReturnValue(outcome);
		requests.next(request(SeverityEnum.DANGER));
		await dialog.confirm();

		// Act
		await dialog.cancel();

		// Assert
		expect(outcome.observed).toBe(false);
		expect(await dialog.title()).toBe('');
	});

	it('runs the command once when confirmed again while it runs', async () => {
		// Arrange
		const dialog = await create();
		accept.mockReturnValue(new Subject<void>());
		requests.next(request(SeverityEnum.DANGER));

		// Act
		await dialog.confirm();
		await dialog.confirm();

		// Assert
		expect(accept).toHaveBeenCalledTimes(1);
	});

	it('cancels the running command when the dialog is destroyed', async () => {
		// Arrange
		const dialog = await create();
		const outcome = new Subject<void>();
		accept.mockReturnValue(outcome);
		requests.next(request(SeverityEnum.DANGER));
		await dialog.confirm();

		// Act
		fixture.destroy();

		// Assert
		expect(outcome.observed).toBe(false);
	});
});
