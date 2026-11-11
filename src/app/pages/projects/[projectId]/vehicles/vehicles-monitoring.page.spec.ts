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
import { VehiclesMonitoringHarness } from '@pages/projects/[projectId]/vehicles/testing/vehicles-monitoring.harness';
import { VehiclesMonitoringPage } from '@pages/projects/[projectId]/vehicles/vehicles-monitoring.page';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { VehicleMapper } from '@shared/mappers/vehicle.mapper';
import { PageModel } from '@shared/models/model/page.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

@Component({ template: '' })
class EmptyComponent {}

const VEHICLE = VehicleMapper.toModel(VEHICLE_DTO);

const pageOf = (content: VehicleModel[]): PageModel<VehicleModel> => ({
	content,
	page: 0,
	size: 20,
	totalElements: content.length,
	totalPages: 1,
	hasNext: false,
	lastRefresh: new Date(),
});

/** Facade dont chaque membre non précisé est lu comme un signal vide ou appelé comme une commande sans effet. */
function silentFacade(): Record<string, unknown> {
	const members: Record<string, unknown> = {};
	return new Proxy(members, {
		get: (_, key: string | symbol): unknown => {
			if (typeof key !== 'string' || key === 'then') return undefined;
			return (members[key] ??= vi.fn(() => undefined));
		},
	});
}

describe('VehiclesMonitoringPage', () => {
	let facade: Record<string, unknown>;

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;
	const set = (name: string, value: unknown): void => (facade[name] as WritableSignal<unknown>).set(value);

	async function create(url = '/'): Promise<VehiclesMonitoringHarness> {
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(VehiclesMonitoringPage),
			VehiclesMonitoringHarness,
		);
	}

	beforeEach(() => {
		facade = {
			vehiclesPage: signal(pageOf([VEHICLE])),
			vehiclesPageError: signal(undefined),
			vehiclesPageLoading: signal(false),
			vehiclesPageSilentLoading: signal(false),
			vehiclesPageQueryParam: signal(undefined),
			vehiclesPageStatusParam: signal(undefined),
			presencesStatusMetadata: signal([
				{ label: '-', value: undefined },
				{ label: 'Out', value: 'OUT' },
			]),
			inputPageSearchParameters: vi.fn(),
			fetchVehiclesPage: vi.fn(),
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
				provideRouter([{ path: '**', component: EmptyComponent }]),
				REFRESH_SERVICE_STUB,
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: SelectedProjectFacade, useValue: silentFacade() },
				{ provide: SessionFacade, useValue: silentFacade() },
				{ provide: VehicleFacade, useValue: facade },
			],
		});
	});

	it('loads the first batch of vehicles with the default filters and shows one row per vehicle', async () => {
		// Arrange
		const harness = await create();

		// Act
		const rows = await harness.rows();

		// Assert
		expect([
			await harness.title(),
			rows.length,
			calls('inputPageSearchParameters'),
			calls('fetchVehiclesPage'),
		]).toEqual([
			'projectHome.vehiclesPage.title',
			1,
			[[undefined, undefined, undefined, undefined, undefined]],
			[[undefined, 20]],
		]);
	});

	it('starts from the filters carried by the url', async () => {
		// Arrange
		const harness = await create('/?q=van&status=OUT');

		// Act
		const searched = await harness.searchedText();

		// Assert
		expect([searched, calls('inputPageSearchParameters')[0]]).toEqual([
			'van',
			['van', undefined, 'OUT', undefined, undefined],
		]);
	});

	it('searches the typed text and the chosen status from the first batch and writes them in the url', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.chooseStatus('OUT');
		await harness.search('van');

		// Assert
		expect([calls('fetchVehiclesPage').at(-1), TestBed.inject(Router).url]).toEqual([
			[0, 20],
			'/?q=van&status=OUT',
		]);
	});

	it.each([
		{ name: 'no filter', query: undefined, status: undefined, expected: undefined },
		{ name: 'a text and a status', query: 'van', status: 'OUT', expected: '2' },
	])('counts the active filters with $name', async ({ query, status, expected }) => {
		// Arrange
		set('vehiclesPageQueryParam', query);
		set('vehiclesPageStatusParam', status);
		const harness = await create();

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe(expected);
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		set('vehiclesPageQueryParam', 'van');
		set('vehiclesPage', pageOf([]));
		const harness = await create('/?q=van');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await harness.searchedText(), calls('fetchVehiclesPage').at(-1)]).toEqual(['', [0, 20]]);
	});

	it('asks for the next batch when the list retries', async () => {
		// Arrange
		set('vehiclesPageError', PageStateHelper.toNotification(ERROR_500));
		const harness = await create();

		// Act
		await (await (await harness.list()).error())?.retry();

		// Assert
		expect(calls('fetchVehiclesPage').at(-1)).toEqual([1, 20]);
	});
});
