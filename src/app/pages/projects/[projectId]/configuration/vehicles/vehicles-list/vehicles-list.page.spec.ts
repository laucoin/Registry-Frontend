import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehiclesListHarness } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/testing/vehicles-list.harness';
import { VehiclesListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicles-list/vehicles-list.page';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { PageModel } from '@shared/models/model/page.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

@Component({ template: '' })
class EmptyComponent {}

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

const pageOf = (ids: string[], hasNext = false): PageModel<VehicleModel> => ({
	content: ids.map(
		(id) =>
			({
				id,
				licensePlate: id,
				brand: 'R',
				model: 'T',
				visible: true,
				status: { value: 'IN', label: 'In' },
			}) as unknown as VehicleModel,
	),
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : ids.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

describe('VehiclesListPage', () => {
	let facade: Record<string, Mock>;
	let authorities: WritableSignal<string[]>;

	const calls = (name: string): unknown[][] => facade[name].mock.calls;
	const param = (name: string, value: unknown): void =>
		(facade[name] as unknown as WritableSignal<unknown>).set(value);

	async function create(page: PageModel<VehicleModel> | undefined, url = '/'): Promise<VehiclesListHarness> {
		param('vehiclesPage', page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(VehiclesListPage),
			VehiclesListHarness,
		);
	}

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_VEHICLE_C']);
		facade = Object.assign(autoMock(undefined), {
			vehiclesPage: signal(undefined),
			vehiclesPageError: signal(undefined),
			vehiclesPageLoading: signal(false),
			vehiclesPageSilentLoading: signal(false),
			vehiclesPageQueryParam: signal(undefined),
			vehiclesPageAtParam: signal(undefined),
			vehiclesPageStatusParam: signal(undefined),
			vehiclesPageIsVisibleParam: signal(undefined),
			presencesStatusMetadata: signal([]),
			visibilitiesMetadata: signal(CHOICES),
			fetchVehiclesPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		}) as unknown as Record<string, Mock>;
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
				{ provide: VehicleFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: authorities() }),
						selectedProject: signal({ id: 'p1' }),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), confirm: vi.fn() } },
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
		expect([title, calls('inputPageSearchParameters'), calls('fetchVehiclesPage')]).toEqual([
			'vehicles.list.title',
			[[undefined, undefined, undefined, undefined, undefined]],
			[[undefined, undefined]],
		]);
	});

	it('starts from the text and the sort carried by the url', async () => {
		// Arrange
		const harness = await create(undefined, '/?q=van&sort=-licensePlate');

		// Act
		const searched = await (await harness.search()).searchedText();

		// Assert
		expect([searched, calls('inputPageSearchParameters')[0]]).toEqual([
			'van',
			['van', undefined, undefined, undefined, '-licensePlate'],
		]);
	});

	it('searches the typed text from the first batch and writes it in the url', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await (await harness.search()).search('van');

		// Assert
		expect([calls('fetchVehiclesPage').at(-1), TestBed.inject(Router).url]).toEqual([[0, undefined], '/?q=van']);
	});

	it('counts every applied filter', async () => {
		// Arrange
		param('vehiclesPageQueryParam', 'van');
		param('vehiclesPageAtParam', new Date());
		param('vehiclesPageStatusParam', 'IN');
		param('vehiclesPageIsVisibleParam', false);
		const harness = await create(pageOf([]));

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe('4');
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		param('vehiclesPageQueryParam', 'van');
		const harness = await create(pageOf([]), '/?q=van');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await (await harness.search()).searchedText(), calls('fetchVehiclesPage').at(-1)]).toEqual([
			'',
			[0, undefined],
		]);
	});

	it('shows one row per element and asks for the next batch when the list asks for it', async () => {
		// Arrange
		const harness = await create(pageOf(['e1', 'e2'], true));

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect([await harness.rows(), calls('fetchVehiclesPage').at(-1)]).toEqual([
			['e1', 'e2'],
			[1, 20],
		]);
	});

	it.each([
		{
			name: 'offers the creation to a user who creates them',
			granted: ['p1_REGISTRY_PROJECT_VEHICLE_C'],
			shown: true,
		},
		{ name: 'hides the creation from the others', granted: [], shown: false },
	])('$name', async ({ granted, shown }) => {
		// Arrange
		authorities.set(granted);
		const harness = await create(pageOf([]));

		// Act
		const offered = await harness.canCreate();

		// Assert
		expect(offered).toBe(shown);
	});

	it('opens the creation form and keeps the search', async () => {
		// Arrange
		const harness = await create(pageOf([]), '/?q=van');

		// Act
		await harness.create();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/create?q=van');
	});
});
