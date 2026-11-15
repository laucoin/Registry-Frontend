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
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementCommunicationsListComponent } from '@shared/ui/domain/movement-communications-list/movement-communications-list.component';
import { MovementCommunicationsListHarness } from '@shared/ui/domain/movement-communications-list/testing/movement-communications-list.harness';

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

describe('MovementCommunicationsListComponent', () => {
	let fixture: ComponentFixture<MovementCommunicationsListComponent>;
	let facade: Record<string, Mock | WritableSignal<unknown>>;
	let firstPageReload: Subject<unknown>;
	let currentPageReload: Subject<unknown>;
	let alertCreation: Subject<unknown>;
	let loading: WritableSignal<boolean>;
	let intersect: (visible: boolean) => void;

	async function create(): Promise<MovementCommunicationsListHarness> {
		fixture = TestBed.createComponent(MovementCommunicationsListComponent);
		fixture.componentRef.setInput('movement', { id: 'x1' } as never);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementCommunicationsListHarness);
	}

	beforeEach(() => {
		firstPageReload = new Subject<unknown>();
		currentPageReload = new Subject<unknown>();
		alertCreation = new Subject<unknown>();
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
			movementCommunicationsPage: signal({ page: 0, size: 10, content: [...MESSAGES].reverse() }),
			movementCommunicationsPageLoading: loading,
			movementCommunicationsPageSilentLoading: signal(false),
			fetchMovementCommunicationsPage: vi.fn(),
			reloadMovementCommunications: vi.fn(),
			loadOlderMovementCommunications: vi.fn(),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: MovementFacade, useValue: facade },
				{ provide: AlertFacade, useValue: { handleAlertCreation: (): Subject<unknown> => alertCreation } },
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
		const calls = (facade['fetchMovementCommunicationsPage'] as Mock).mock.calls;

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
		expect(facade['reloadMovementCommunications']).toHaveBeenCalledWith('x1');
	});

	it('stops reloading once the list is destroyed', async () => {
		// Arrange
		await create();
		fixture.destroy();

		// Act
		firstPageReload.next(undefined);

		// Assert
		expect(facade['reloadMovementCommunications']).not.toHaveBeenCalled();
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
		expect((facade['loadOlderMovementCommunications'] as Mock).mock.calls.length).toBe(expected);
	});

	it('quotes the alert of each message', async () => {
		// Arrange
		const harness = await create();

		// Act
		const alert = await (await harness.messages())[0].alert();

		// Assert
		expect(alert?.title).toBe('Fire');
	});

	it('reloads the first batch when an alert is created from it', async () => {
		// Arrange
		await create();

		// Act
		alertCreation.next(undefined);

		// Assert
		expect(facade['reloadMovementCommunications']).toHaveBeenCalledWith('x1');
	});
});
