import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { NEVER, Observable } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { communicationFacadeStub } from '@pages/projects/[projectId]/movements/communication/data/testing/communication-facade.stub';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementsListPage } from '@pages/projects/[projectId]/movements/movements-list/movements-list.page';
import {
	MovementCreationEnum,
	MovementsListHarness,
} from '@pages/projects/[projectId]/movements/movements-list/testing/movements-list.harness';
import { ClockService } from '@shared/helpers/clock.service';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { MovementModel } from '@shared/models/model/movement.model';
import { PageModel } from '@shared/models/model/page.model';
import { movementOf } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

@Component({ template: '' })
class EmptyComponent {}

const pageOf = (ids: string[], hasNext = false): PageModel<MovementModel> => ({
	content: ids.map((id) => movementOf({ id })),
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : ids.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

const TYPES = [
	{ label: '-', value: undefined },
	{ label: 'In', value: 'IN' },
];

describe('MovementsListPage', () => {
	let facade: Record<string, unknown>;
	let authorities: WritableSignal<string[]>;

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;
	const param = (name: string, value: unknown): void => (facade[name] as WritableSignal<unknown>).set(value);

	async function create(page: PageModel<MovementModel> | undefined, url = '/'): Promise<MovementsListHarness> {
		param('movementsPage', page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(MovementsListPage),
			MovementsListHarness,
		);
	}

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_MOVEMENT_C']);
		facade = Object.assign(autoMock(undefined), {
			movementCommunicationsPage: signal(undefined),
			movementCommunicationsPageLoading: signal(false),
			movementCommunicationsPageSilentLoading: signal(false),
			movementCommunicationsPageError: signal(undefined),
			selectedProjectId: signal('p1'),
			movementsPage: signal(undefined),
			movementsPageError: signal(undefined),
			movementsPageLoading: signal(false),
			movementsPageSilentLoading: signal(false),
			movementsPageTypeParam: signal(undefined),
			movementsPageFromParam: signal(undefined),
			movementsPageToParam: signal(undefined),
			movementsPageIsVisibleParam: signal(undefined),
			movementTypesMetadata: signal(TYPES),
			visibilitiesMetadata: signal([]),
			fetchMovementsPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		});
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { global: { list: { 'active-filters': '{{ count }}' } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				REFRESH_SERVICE_STUB,
				{ provide: MovementFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: authorities() }),
						selectedProject: signal({ id: 'p1', options: [] }),
						selectedProjectHasOption: (): ReturnType<typeof signal<boolean>> => signal(false),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: CommunicationFacade, useValue: communicationFacadeStub() },
				{ provide: AlertFacade, useValue: { handleAlertCreation: (): Observable<never> => NEVER } },
				{ provide: MovementPrefillService, useValue: { canCreate: signal(false), openReverse: vi.fn() } },
				{ provide: ClockService, useValue: { now: signal(new Date('2026-01-05T10:00:00Z').getTime()) } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('shows its title and loads the first batch when the url carries no filter', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const title = await harness.title();

		// Assert
		expect([title, calls('inputPageSearchParameters'), calls('fetchMovementsPage')]).toEqual([
			'movements.list.title',
			[[undefined, undefined, undefined, undefined, undefined]],
			[[undefined, undefined]],
		]);
	});

	it('starts from the filters carried by the url', async () => {
		// Arrange
		const harness = await create(undefined, '/?type=IN&from=2026-01-02T00:00:00.000Z');

		// Act
		const type = await (await harness.search()).value('type');

		// Assert
		expect([type, calls('inputPageSearchParameters')[0]]).toEqual([
			'IN',
			['IN', new Date('2026-01-02T00:00:00.000Z'), undefined, undefined, undefined],
		]);
	});

	it('counts every applied filter', async () => {
		// Arrange
		param('movementsPageTypeParam', 'IN');
		param('movementsPageFromParam', new Date());
		param('movementsPageToParam', new Date());
		param('movementsPageIsVisibleParam', true);
		const harness = await create(pageOf([]));

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe('4');
	});

	it('searches by itself with the chosen filter once the debounce elapsed', async () => {
		// Arrange
		vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
		const harness = await create(pageOf([]));

		// Act
		await (await harness.search()).choose('type', 'IN');
		vi.advanceTimersByTime(400);
		vi.useRealTimers();
		await harness.title();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/?type=IN');
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		param('movementsPageTypeParam', 'IN');
		const harness = await create(pageOf([]), '/?type=IN');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await (await harness.search()).value('type'), calls('fetchMovementsPage').at(-1)]).toEqual([
			'',
			[0, undefined],
		]);
	});

	it('shows one row per movement and asks for the next batch when the list asks for it', async () => {
		// Arrange
		const harness = await create(pageOf(['m1', 'm2'], true));

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect([await harness.rows(), calls('fetchMovementsPage').at(-1)]).toEqual([
			['m1', 'm2'],
			[1, 20],
		]);
	});

	it.each([
		{
			name: 'both creations to a user who creates movements',
			granted: ['p1_REGISTRY_PROJECT_MOVEMENT_C'],
			expected: ['movements.list.create.registered', 'movements.list.create.guest'],
		},
		{ name: 'no creation to the others', granted: ['p1_REGISTRY_PROJECT_MOVEMENT_R'], expected: [] },
	])('offers $name', async ({ granted, expected }) => {
		// Arrange
		authorities.set(granted);
		const harness = await create(pageOf([]));

		// Act
		const creations = await harness.creations();

		// Assert
		expect(creations).toEqual(expected);
	});

	it.each([
		{ kind: MovementCreationEnum.REGISTERED, url: '/create/registered' },
		{ kind: MovementCreationEnum.GUEST, url: '/create/guest' },
	])('opens the $kind movement form', async ({ kind, url }) => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await harness.create(kind);

		// Assert
		expect(TestBed.inject(Router).url).toBe(url);
	});
});
