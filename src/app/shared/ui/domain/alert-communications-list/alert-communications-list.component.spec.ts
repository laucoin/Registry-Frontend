import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { AlertCommunicationsListComponent } from '@shared/ui/domain/alert-communications-list/alert-communications-list.component';
import { AlertCommunicationsListHarness } from '@shared/ui/domain/alert-communications-list/testing/alert-communications-list.harness';

const MESSAGES = [
	{
		id: 'c1',
		visible: true,
		message: 'first',
		dateTime: new Date('2026-01-01T10:00:00Z'),
		lastEdition: { user: { id: 'u2', firstName: 'Bo', lastName: 'B' } },
		alert: { title: 'Fire', status: { value: 'IN_PROGRESS', label: 'Open' } },
	},
	{
		id: 'c2',
		visible: true,
		message: 'second',
		dateTime: new Date('2026-01-01T10:05:00Z'),
		lastEdition: { user: { id: 'u2', firstName: 'Bo', lastName: 'B' } },
	},
	{
		id: 'c3',
		visible: true,
		message: 'third',
		dateTime: new Date('2026-01-01T10:10:00Z'),
		lastEdition: { user: { id: 'u3', firstName: 'Cy', lastName: 'C' } },
	},
];

describe('AlertCommunicationsListComponent', () => {
	let fixture: ComponentFixture<AlertCommunicationsListComponent>;
	let facade: Record<string, Mock | WritableSignal<unknown>>;
	let firstPageReload: Subject<unknown>;
	let currentPageReload: Subject<unknown>;
	let loading: WritableSignal<boolean>;
	let intersect: (visible: boolean) => void;

	async function create(): Promise<AlertCommunicationsListHarness> {
		fixture = TestBed.createComponent(AlertCommunicationsListComponent);
		fixture.componentRef.setInput('alert', { id: 'x1' } as never);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AlertCommunicationsListHarness);
	}

	beforeEach(() => {
		firstPageReload = new Subject<unknown>();
		currentPageReload = new Subject<unknown>();
		loading = signal(false);
		Element.prototype.scrollIntoView = vi.fn();
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				constructor(callback: IntersectionObserverCallback) {
					intersect = (visible: boolean): void =>
						callback(
							[{ isIntersecting: visible } as IntersectionObserverEntry],
							{} as IntersectionObserver,
						);
				}
				public observe: Mock<() => void> = vi.fn();
				public unobserve: Mock<() => void> = vi.fn();
				public disconnect: Mock<() => void> = vi.fn();
			},
		);
		facade = {
			alertCommunicationsPage: signal({ page: 0, size: 10, content: [...MESSAGES].reverse() }),
			alertCommunicationsPageLoading: loading,
			alertCommunicationsPageSilentLoading: signal(false),
			fetchAlertCommunicationsPage: vi.fn(),
			reloadAlertCommunications: vi.fn(),
			loadOlderAlertCommunications: vi.fn(),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: AlertFacade, useValue: facade },
				{
					provide: CommunicationFacade,
					useValue: {
						handleCommunicationFirstPageReload: (): Subject<unknown> => firstPageReload,
						handleCommunicationCurrentPageReload: (): Subject<unknown> => currentPageReload,
					},
				},
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({ id: 'u1', authorities: [] }),
						selectedProject: signal({ id: 'p1' }),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn(), confirm: vi.fn() } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: {} },
			],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('loads the first batch of communications when it opens', async () => {
		// Arrange
		await create();

		// Act
		const calls = (facade['fetchAlertCommunicationsPage'] as Mock).mock.calls;

		// Assert
		expect(calls).toEqual([['x1', undefined, undefined]]);
	});

	it('shows the messages in chronological order, grouped by author', async () => {
		// Arrange
		const harness = await create();

		// Act
		const messages = await harness.messages();

		// Assert
		expect(await Promise.all(messages.map((message) => message.text()))).toEqual(['first', 'second', 'third']);
		expect(await Promise.all(messages.map((message) => message.grouped()))).toEqual([false, true, false]);
	});

	it.each([
		{ name: 'a communication is created or removed', events: (): Subject<unknown> => firstPageReload },
		{ name: 'a communication changes', events: (): Subject<unknown> => currentPageReload },
	])('reloads the conversation when $name', async ({ events }) => {
		// Arrange
		await create();

		// Act
		events().next(undefined);

		// Assert
		expect(facade['reloadAlertCommunications']).toHaveBeenCalledWith('x1');
	});

	it('stops reloading once the list is destroyed', async () => {
		// Arrange
		await create();
		fixture.destroy();

		// Act
		firstPageReload.next(undefined);

		// Assert
		expect(facade['reloadAlertCommunications']).not.toHaveBeenCalled();
	});

	it.each([
		{
			name: 'loads the older communications when the top of the conversation is reached',
			busy: false,
			expected: 1,
		},
		{ name: 'waits for the running load before asking for older communications', busy: true, expected: 0 },
	])('$name', async ({ busy, expected }) => {
		// Arrange
		vi.useFakeTimers();
		await create();
		await vi.advanceTimersByTimeAsync(0);
		loading.set(busy);

		// Act
		intersect(true);

		// Assert
		expect((facade['loadOlderAlertCommunications'] as Mock).mock.calls.length).toBe(expected);
	});
});
