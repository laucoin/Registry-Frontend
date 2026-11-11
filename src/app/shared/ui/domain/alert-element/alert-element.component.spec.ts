import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { NEVER, Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { communicationFacadeStub } from '@pages/projects/[projectId]/movements/communication/data/testing/communication-facade.stub';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { AlertModel } from '@shared/models/model/alert.model';
import { AlertElementComponent } from '@shared/ui/domain/alert-element/alert-element.component';
import { AlertElementHarness } from '@shared/ui/domain/alert-element/testing/alert-element.harness';

const ALERT = {
	id: 'e1',
	visible: true,
	title: 'fire',
	dateTime: new Date('2026-01-01T10:00:00Z'),
	status: { value: 'RESOLVED', label: 'Resolved' },
};

describe('AlertElementComponent', () => {
	let fixture: ComponentFixture<AlertElementComponent>;
	let confirm: Mock<(confirmation: { accept: () => void }) => void>;
	let facade: Record<string, Mock>;

	async function create(alert: object, inputs: Record<string, unknown> = {}): Promise<AlertElementHarness> {
		fixture = TestBed.createComponent(AlertElementComponent);
		fixture.componentRef.setInput('alert', alert as AlertModel);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AlertElementHarness);
	}

	const layerOpened = (): boolean =>
		(
			fixture.componentInstance as unknown as { communicationsLayerOpened: () => boolean }
		).communicationsLayerOpened();

	beforeEach(() => {
		confirm = vi.fn();
		facade = Object.assign(autoMock(undefined), {
			alertCommunicationsPage: signal(undefined),
			alertCommunicationsPageLoading: signal(false),
			alertCommunicationsPageSilentLoading: signal(false),
			handleAlertCreation: (): Observable<never> => NEVER,
		}) as unknown as Record<string, Mock>;
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: AlertFacade, useValue: facade },
				{ provide: CommunicationFacade, useValue: communicationFacadeStub() },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({
							id: 'u1',
							authorities: [
								'p1_REGISTRY_PROJECT_ALERT_U',
								'p1_REGISTRY_PROJECT_ALERT_SOFT_DELETE',
								'p1_REGISTRY_PROJECT_ALERT_RESTORE',
								'p1_REGISTRY_PROJECT_ALERT_D',
							],
						}),
						selectedProject: signal({ id: 'p1', options: [] }),
						selectedProjectHasOption: (): ReturnType<typeof signal<boolean>> => signal(false),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn(), confirm } },
				{ provide: IntervalPipe, useValue: { transform: (): string => '1 min' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
			],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('the row', () => {
		it.each(['', '   ', '​﻿'])('shows the untitled label for the blank title %j', async (title) => {
			// Arrange
			const alert = { ...ALERT, title };

			// Act
			const harness = await create(alert);

			// Assert
			expect([await harness.untitledShown(), await harness.title()]).toEqual([true, 'fr.alerts.untitled']);
		});

		it('shows a written title with capitals', async () => {
			// Arrange
			const harness = await create(ALERT);

			// Act
			const title = await harness.title();

			// Assert
			expect(title).toBe('Fire');
		});

		it.each([
			{ name: 'in progress', value: 'IN_PROGRESS', icon: 'triangle-exclamation', variant: 'warning' },
			{ name: 'canceled', value: 'CANCELED', icon: 'xmark', variant: 'neutral' },
			{ name: 'resolved', value: 'RESOLVED', icon: 'circle-check', variant: 'success' },
			{ name: 'of an unknown status', value: 'OTHER', icon: 'circle-check', variant: 'success' },
		])('shows an alert $name with its icon and colour', async ({ value, icon, variant }) => {
			// Arrange
			const alert = { ...ALERT, status: { value, label: 'Status' } };

			// Act
			const harness = await create(alert);

			// Assert
			expect([await harness.statusIconName(), await harness.variants()]).toEqual([
				icon,
				{ avatar: variant, status: variant },
			]);
		});

		it.each([
			{ name: 'a hidden alert and disables its row', visible: false, expected: [true, true] },
			{ name: 'nothing for a visible alert', visible: true, expected: [false, false] },
		])('marks $name', async ({ visible, expected }) => {
			// Arrange
			const alert = { ...ALERT, visible };

			// Act
			const harness = await create(alert);

			// Assert
			expect([await harness.hiddenShown(), await harness.disabled()]).toEqual(expected);
		});
	});

	describe('the elapsed time', () => {
		it('appends the elapsed time to the label of an alert in progress once the timer ticked', async () => {
			// Arrange
			vi.useFakeTimers();
			const harness = await create({ ...ALERT, status: { value: 'IN_PROGRESS', label: 'Open' } });

			// Act
			vi.advanceTimersByTime(1100);

			// Assert
			expect(await harness.statusLabel()).toBe('Open (1 min)');
		});

		it('keeps the plain label of an alert that is not in progress when the timer ticks', async () => {
			// Arrange
			vi.useFakeTimers();
			const harness = await create(ALERT);

			// Act
			vi.advanceTimersByTime(1100);

			// Assert
			expect(await harness.statusLabel()).toBe('Resolved');
		});
	});

	describe('the actions', () => {
		it.each([
			{ name: 'a visible alert', visible: true, expected: ['resolve', 'cancel', 'softDelete', 'hardDelete'] },
			{ name: 'a hidden alert', visible: false, expected: ['restore', 'hardDelete'] },
		])('lists the actions of $name in a stable order', async ({ visible, expected }) => {
			// Arrange
			const harness = await create({ ...ALERT, status: { value: 'IN_PROGRESS', label: 'Open' }, visible });

			// Act
			const actions = await (await harness.actions()).actions();

			// Assert
			expect(actions.map((action) => action.id)).toEqual(expected);
		});

		it('asks for a confirmation before deleting, then deletes the alert', async () => {
			// Arrange
			const harness = await create(ALERT);

			// Act
			await (await harness.actions()).run('hardDelete');
			defined(confirm.mock.calls[0])[0].accept();

			// Assert
			expect(facade['hardDeleteAlert']).toHaveBeenCalledTimes(1);
		});

		it('hides the actions when the list asks for it', async () => {
			// Arrange
			const harness = await create(ALERT, { actionMenuVisible: false });

			// Act
			const shown = await (await harness.actions()).shown();

			// Assert
			expect(shown).toBe(false);
		});
	});

	describe('the communications', () => {
		it.each([
			{
				name: 'to add a communication to an alert in progress',
				value: 'IN_PROGRESS',
				expected: { text: 'fr.alerts.actions.add-communication (fire)', variant: 'info' },
			},
			{
				name: 'to read the communications of a closed alert',
				value: 'RESOLVED',
				expected: { text: 'fr.alerts.actions.communications (fire)', variant: 'neutral' },
			},
		])('offers $name', async ({ value, expected }) => {
			// Arrange
			const alert = { ...ALERT, status: { value, label: 'Status' } };

			// Act
			const harness = await create(alert);

			// Assert
			expect(await harness.communicationsButton()).toEqual(expected);
		});

		it('hides the communications button when the list asks for it', async () => {
			// Arrange
			const harness = await create(ALERT, { addButtonVisible: false });

			// Act
			const button = await harness.communicationsButton();

			// Assert
			expect(button).toBeUndefined();
		});

		it('opens the communications layer with the communication form, and closes it when the layer asks', async () => {
			// Arrange
			const harness = await create(ALERT);
			await harness.openCommunications();
			const shown = [layerOpened(), await harness.communicationFormShown()];

			// Act
			await harness.hideCommunications();

			// Assert
			expect([shown, layerOpened()]).toEqual([[true, true], false]);
		});

		it('keeps the communications layer open when an element inside it hides its own panel', async () => {
			// Arrange
			const harness = await create(ALERT);
			await harness.openCommunications();
			const inner: HTMLElement = fixture.nativeElement.querySelector(
				'[data-test-id="alert-element-drawer-actions"]',
			);

			// Act
			inner.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

			// Assert
			expect(layerOpened()).toBe(true);
		});
	});
});
