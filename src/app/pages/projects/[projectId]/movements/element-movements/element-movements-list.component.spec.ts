import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { BehaviorSubject, NEVER, Observable, of, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { communicationFacadeStub } from '@pages/projects/[projectId]/movements/communication/data/testing/communication-facade.stub';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { ElementMovementsListComponent } from '@pages/projects/[projectId]/movements/element-movements/element-movements-list.component';
import {
	ElementMovements,
	injectElementMovements,
} from '@pages/projects/[projectId]/movements/element-movements/inject-element-movements';
import { ElementMovementsListHarness } from '@pages/projects/[projectId]/movements/element-movements/testing/element-movements-list.harness';
import { ClockService } from '@shared/helpers/clock.service';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { SortDirectionEnum } from '@shared/models/enumeration/sort-direction.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { PageModel } from '@shared/models/model/page.model';
import { movementOf } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

interface Named {
	name: string;
}

interface Source {
	element: Observable<Named>;
	page: WritableSignal<PageModel<MovementModel> | undefined>;
	type: WritableSignal<string | undefined>;
	fetchElement: Mock;
	fetchDetails: Mock;
	reloadDetails: Mock;
	fetchPage: Mock;
	reloadPage: Mock;
	inputSearch: Mock;
}

let source: Source;

@Component({
	imports: [ElementMovementsListComponent],
	templateUrl: './element-movements-list.component.spec.html',
})
class HostComponent {
	public readonly movements: ElementMovements<Named> = injectElementMovements<Named>({
		idParam: 'elementId',
		page: source.page,
		pageError: signal(undefined),
		pageLoading: signal(false),
		pageSilentLoading: signal(false),
		appliedFilters: () => [source.type(), undefined],
		fetchElement: source.fetchElement,
		fetchDetails: source.fetchDetails,
		reloadDetails: source.reloadDetails,
		fetchPage: source.fetchPage,
		reloadPage: source.reloadPage,
		inputSearch: source.inputSearch,
		titleOf: (element) => element.name,
	});
}

const pageOf = (ids: string[], hasNext = false): PageModel<MovementModel> => ({
	content: ids.map((id) => movementOf({ id })),
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : ids.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

describe('ElementMovementsListComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let params: BehaviorSubject<ParamMap>;
	let snapshotParams: Record<string, string>;
	let query: BehaviorSubject<ParamMap>;
	let firstPageReload: Subject<void>;
	let currentPageReload: Subject<void>;
	let navigate: Mock;

	async function create(): Promise<ElementMovementsListHarness> {
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ElementMovementsListHarness);
	}

	function routeTo(id: string): void {
		snapshotParams = { elementId: id };
		params.next(convertToParamMap(snapshotParams));
	}

	beforeEach(() => {
		snapshotParams = { elementId: 'e1' };
		params = new BehaviorSubject<ParamMap>(convertToParamMap(snapshotParams));
		query = new BehaviorSubject<ParamMap>(convertToParamMap({}));
		firstPageReload = new Subject<void>();
		currentPageReload = new Subject<void>();
		navigate = vi.fn(() => Promise.resolve(true));
		source = {
			element: of({ name: 'Hike' }),
			page: signal(undefined),
			type: signal(undefined),
			fetchElement: vi.fn((): Observable<Named> => source.element),
			fetchDetails: vi.fn(),
			reloadDetails: vi.fn(),
			fetchPage: vi.fn(),
			reloadPage: vi.fn(),
			inputSearch: vi.fn(),
		};
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { global: { list: { 'active-filters': '{{ count }}' } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						paramMap: params,
						queryParamMap: query,
						get snapshot(): object {
							return { params: snapshotParams, queryParamMap: query.value, url: [] };
						},
					},
				},
				{ provide: Router, useValue: { navigate, url: '/', events: NEVER } },
				REFRESH_SERVICE_STUB,
				{
					provide: MovementFacade,
					useValue: Object.assign(autoMock(undefined), {
						handleMovementFirstPageReload: (): Subject<void> => firstPageReload,
						handleMovementCurrentPageReload: (): Subject<void> => currentPageReload,
						movementTypesMetadata: signal([]),
						visibilitiesMetadata: signal([]),
						movementCommunicationsPage: signal(undefined),
						movementCommunicationsPageLoading: signal(false),
						movementCommunicationsPageSilentLoading: signal(false),
						movementCommunicationsPageError: signal(undefined),
					}),
				},
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({ id: 'u1', authorities: [] }),
						selectedProject: signal({ id: 'p1', options: [] }),
						selectedProjectHasOption: (): WritableSignal<boolean> => signal(false),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: CommunicationFacade, useValue: communicationFacadeStub() },
				{ provide: AlertFacade, useValue: { handleAlertCreation: (): Observable<never> => NEVER } },
				{ provide: MovementPrefillService, useValue: { canCreate: signal(false), openReverse: vi.fn() } },
				{ provide: ClockService, useValue: { now: signal(new Date('2026-01-05T10:00:00Z').getTime()) } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), confirm: vi.fn(), notify: vi.fn() } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('loads the element, its details and the first batch of its movements, and titles the page after it', async () => {
		// Arrange
		const harness = await create();

		// Act
		const title = await harness.title();

		// Assert
		expect([
			title,
			source.fetchElement.mock.calls,
			source.fetchDetails.mock.calls,
			source.fetchPage.mock.calls,
		]).toEqual(['Hike', [['e1']], [['e1']], [['e1', undefined, undefined]]]);
	});

	it('shows a skeleton until the element is loaded', async () => {
		// Arrange
		source.element = NEVER;
		const harness = await create();

		// Act
		const title = await harness.title();

		// Assert
		expect(title).toBeUndefined();
	});

	it.each([
		{ name: 'loads again when the route moves to another element', id: 'e2', loads: [['e1'], ['e2']] },
		{ name: 'does not load again when the route keeps the same element', id: 'e1', loads: [['e1']] },
	])('$name', async ({ id, loads }) => {
		// Arrange
		await create();

		// Act
		routeTo(id);

		// Assert
		expect(source.fetchElement.mock.calls).toEqual(loads);
	});

	it('applies the filters of the url and loads the movements again when they change', async () => {
		// Arrange
		await create();
		source.fetchPage.mockClear();

		// Act
		query.next(convertToParamMap({ type: 'IN' }));
		fixture.detectChanges();

		// Assert
		expect([source.inputSearch.mock.calls.at(-1)?.[0].type, source.fetchPage.mock.calls]).toEqual([
			'IN',
			[['e1', undefined, undefined]],
		]);
	});

	it('counts the applied filters', async () => {
		// Arrange
		source.type.set('IN');
		source.page.set(pageOf([]));
		const harness = await create();

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe('1');
	});

	it('clears the filters, searches from the first batch and writes the url', async () => {
		// Arrange
		source.type.set('IN');
		source.page.set(pageOf([]));
		const harness = await create();

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([source.fetchPage.mock.calls.at(-1), navigate.mock.calls.length > 0]).toEqual([
			['e1', 0, undefined],
			true,
		]);
	});

	it('shows one row per movement and asks for the next batch when the list asks for it', async () => {
		// Arrange
		source.page.set(pageOf(['m1', 'm2'], true));
		const harness = await create();

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect([await harness.rows(), source.fetchPage.mock.calls.at(-1)]).toEqual([
			['m1', 'm2'],
			['e1', 1, 20],
		]);
	});

	it('goes back to the first batch and reloads the details when a movement is created', async () => {
		// Arrange
		await create();

		// Act
		firstPageReload.next();

		// Assert
		expect([source.fetchPage.mock.calls.at(-1), source.reloadDetails.mock.calls]).toEqual([
			['e1', 0, undefined],
			[['e1']],
		]);
	});

	it('reloads the shown batches and the details when a movement changes', async () => {
		// Arrange
		await create();

		// Act
		currentPageReload.next();

		// Assert
		expect([source.reloadPage.mock.calls, source.reloadDetails.mock.calls]).toEqual([[['e1']], [['e1']]]);
	});

	it('loads the details again when the page retries them', async () => {
		// Arrange
		await create();
		const retry: HTMLElement = fixture.debugElement.query(
			By.css(byTestId('element-movements-host-retry-button')),
		).nativeElement;

		// Act
		retry.click();

		// Assert
		expect(source.fetchDetails.mock.calls).toEqual([['e1'], ['e1']]);
	});

	it('stops listening to the movement commands once destroyed', async () => {
		// Arrange
		await create();
		source.fetchPage.mockClear();

		// Act
		fixture.destroy();
		firstPageReload.next();

		// Assert
		expect(source.fetchPage).not.toHaveBeenCalled();
	});

	it('searches by itself with the chosen sort once the debounce elapsed, and writes it in the url', () => {
		// Arrange
		vi.useFakeTimers();
		fixture = TestBed.createComponent(HostComponent);
		fixture.detectChanges();
		const form = fixture.componentInstance.movements.form;
		source.fetchPage.mockClear();

		// Act
		form.sortBy().value.set('dateTime');
		form.sortDirection().value.set(SortDirectionEnum.DESC);
		TestBed.tick();
		vi.advanceTimersByTime(400);

		// Assert
		expect([
			source.inputSearch.mock.calls.at(-1)?.[0].sort,
			source.fetchPage.mock.calls.at(-1),
			navigate.mock.calls.at(-1)?.[1].queryParams.sort,
		]).toEqual(['-dateTime', ['e1', 0, undefined], '-dateTime']);
	});
});
