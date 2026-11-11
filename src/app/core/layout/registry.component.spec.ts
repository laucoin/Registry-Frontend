import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';

import { RegistryComponent } from '@core/layout/registry.component';
import { RegistryHarness } from '@core/layout/testing/registry.harness';
import { UiFacade } from '@core/registry/state/ui.facade';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ConfirmationModel } from '@shared/models/model/confirmation.model';
import { NotificationModel } from '@shared/models/model/notification.model';

interface ToastElement {
	create(message: string, options: { variant: string; title: string; duration?: number }): unknown;
}

describe('RegistryComponent', () => {
	let notifications: Subject<NotificationModel>;
	let confirmations: Subject<ConfirmationModel>;
	let create: MockInstance<ToastElement['create']>;
	let globalError: WritableSignal<NotificationModel | undefined>;
	let harness: RegistryHarness;

	beforeEach(async () => {
		TestBed.resetTestingModule();
		notifications = new Subject<NotificationModel>();
		confirmations = new Subject<ConfirmationModel>();
		globalError = signal<NotificationModel | undefined>(undefined);
		const toast = customElements.get('sgdf-toast') as unknown as { prototype: ToastElement };
		create = vi.spyOn(toast.prototype, 'create').mockReturnValue(undefined);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([]),
				{
					provide: UiFacade,
					useValue: {
						notification: notifications.asObservable(),
						confirmation: confirmations.asObservable(),
						globalError,
					},
				},
			],
		});
		harness = await TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(RegistryComponent),
			RegistryHarness,
		);
	});

	afterEach(() => {
		create.mockRestore();
	});

	it('should show a translated notification with the variant of its severity', () => {
		// Arrange
		const notification: NotificationModel = {
			severity: 'error',
			summary: 'a.title',
			detail: 'a.message',
			life: 3000,
		};

		// Act
		notifications.next(notification);

		// Assert
		expect(create).toHaveBeenCalledWith('fr.a.message', { variant: 'danger', title: 'fr.a.title', duration: 3000 });
	});

	it('should keep a sticky notification until it is closed', () => {
		// Arrange
		const notification: NotificationModel = {
			severity: 'warn',
			summary: 'a.title',
			detail: 'a.message',
			sticky: true,
		};

		// Act
		notifications.next(notification);

		// Assert
		expect(create).toHaveBeenCalledWith('fr.a.message', { variant: 'warning', title: 'fr.a.title', duration: 0 });
	});

	it.each([
		['an unknown severity', { severity: 'unknown' }],
		['no severity', {}],
	])('should fall back to the primary variant and empty texts for %s', (_label, notification: NotificationModel) => {
		// Arrange
		const shown = notification;

		// Act
		notifications.next(shown);

		// Assert
		expect(create).toHaveBeenCalledWith('', { variant: 'primary', title: '', duration: undefined });
	});

	it('should open the confirmation dialog when a command asks for a confirmation', async () => {
		// Arrange
		const dialog = await harness.confirmationDialog();
		const before = await dialog.isOpen();

		// Act
		confirmations.next({
			header: 'Delete',
			message: 'Sure?',
			acceptSeverity: SeverityEnum.DANGER,
			accept: vi.fn(),
		});

		// Assert
		expect(before).toBe(false);
		expect(await dialog.isOpen()).toBe(true);
		expect(await dialog.title()).toBe('Delete');
	});

	it('should keep the routed pages while there is no global error', async () => {
		// Arrange
		const shell = harness;

		// Act
		const error = await shell.globalError();

		// Assert
		expect(error).toBeNull();
		expect(await shell.showsRoutedPages()).toBe(true);
	});

	it('should replace the routed pages with the global error when the application is blocked', async () => {
		// Arrange
		globalError.set({ severity: 'error', summary: 'Down' });

		// Act
		const error = await harness.globalError();

		// Assert
		expect(await error?.title()).toBe('Down');
		expect(await harness.showsRoutedPages()).toBe(false);
	});
});
