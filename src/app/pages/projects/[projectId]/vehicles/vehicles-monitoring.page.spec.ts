import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';

import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VEHICLE_DTO } from '@shared/helpers/testing/response-fixtures';
import { VehicleMapper } from '@shared/mappers/vehicle.mapper';

import { VehiclesMonitoringPage } from './vehicles-monitoring.page';

describe('VehiclesMonitoringPage', () => {
	let fixture: ComponentFixture<VehiclesMonitoringPage>;
	let facade: Record<string, unknown>;
	let queryParams: BehaviorSubject<ParamMap>;

	beforeEach(async () => {
		queryParams = new BehaviorSubject<ParamMap>(convertToParamMap({}));
		facade = {
			vehiclesPage: signal(undefined),
			vehiclesPageLoading: signal(false),
			vehiclesPageSilentLoading: signal(false),
			vehiclesPageError: signal(undefined),
			vehiclesPageQueryParam: signal(undefined),
			vehiclesPageStatusParam: signal(undefined),
			vehiclesPageAtParam: signal(undefined),
			presencesStatusMetadata: signal([]),
			fetchVehiclesPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		};
		await MockBuilder(VehiclesMonitoringPage)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: VehicleFacade, useValue: facade })
			.provide({
				provide: ActivatedRoute,
				useValue: {
					queryParamMap: queryParams.asObservable(),
					snapshot: {
						get queryParamMap(): ParamMap {
							return queryParams.value;
						},
					},
				},
			})
			.provide({ provide: Router, useValue: { navigate: vi.fn(() => Promise.resolve(true)) } });
		fixture = TestBed.createComponent(VehiclesMonitoringPage);
		fixture.detectChanges();
	});

	it('loads the first batch of vehicles when displayed', () => {
		// Arrange
		const expected: unknown[] = [undefined, 20];

		// Act
		const requested: unknown = (facade['fetchVehiclesPage'] as ReturnType<typeof vi.fn>).mock.calls[0];

		// Assert
		expect(requested).toEqual(expected);
	});

	it('hides the link of the counters, which already lead to this page', () => {
		// Arrange
		const selector = 'app-project-vehicle-overview';

		// Act
		const showLink: boolean = ngMocks.input(selector, 'showLink');

		// Assert
		expect(showLink).toBe(false);
	});

	it('searches the vehicles from the first batch with the filters of the form', () => {
		// Arrange
		fixture.componentInstance['model'].set({
			q: 'ford',
			at: null,
			status: 'OUT',
			isVisible: '',
			sortBy: '',
			sortDirection: 'asc',
		});

		// Act
		fixture.componentInstance['search']();

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(
			'ford',
			undefined,
			'OUT',
			undefined,
			undefined,
		);
		expect(facade['fetchVehiclesPage']).toHaveBeenLastCalledWith(0, 20);
	});

	it('clears the filters of the form before searching again', () => {
		// Arrange
		fixture.componentInstance['model'].set({
			q: 'ford',
			at: null,
			status: 'OUT',
			isVisible: '',
			sortBy: '',
			sortDirection: 'asc',
		});

		// Act
		fixture.componentInstance['resetFilters']();

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith(
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
		);
	});

	it('fetches the requested batch when the list asks for one', () => {
		// Arrange
		const request = { page: 2, size: 20 };

		// Act
		ngMocks.output('app-list', 'updateRequired').emit(request);

		// Assert
		expect(facade['fetchVehiclesPage']).toHaveBeenLastCalledWith(2, 20);
	});

	it('hands the page, the loading and the error of the facade to the list', () => {
		// Arrange
		const selector = 'app-list';

		// Act
		const label: string = ngMocks.input(selector, 'label');
		const loading: boolean = ngMocks.input(selector, 'loading');

		// Assert
		expect(label).toBe('projectHome.vehiclesPage.title');
		expect(loading).toBe(false);
	});

	it('turns a vehicle into a status row', () => {
		// Arrange
		const vehicle = VehicleMapper.toModel(VEHICLE_DTO);

		// Act
		const row = fixture.componentInstance['rowOf'](vehicle);

		// Assert
		expect(row.title).toBe('Ford T');
		expect(row.statusVariant).toBe('success');
	});

	it('reloads the vehicles from the filters of the url when they change', () => {
		// Arrange
		(facade['fetchVehiclesPage'] as ReturnType<typeof vi.fn>).mockClear();

		// Act
		queryParams.next(convertToParamMap({ q: 'van', status: 'OUT' }));
		TestBed.tick();

		// Assert
		expect(fixture.componentInstance['model']()).toEqual({
			q: 'van',
			at: null,
			status: 'OUT',
			isVisible: '',
			sortBy: '',
			sortDirection: 'asc',
		});
		expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith(
			'van',
			undefined,
			'OUT',
			undefined,
			undefined,
		);
		expect(facade['fetchVehiclesPage']).toHaveBeenCalledWith(undefined, 20);
	});

	it('writes the submitted filters in the url', () => {
		// Arrange
		fixture.componentInstance['model'].set({
			q: 'van',
			at: null,
			status: '',
			isVisible: '',
			sortBy: '',
			sortDirection: 'asc',
		});
		const navigate: ReturnType<typeof vi.fn> = TestBed.inject(Router).navigate as ReturnType<typeof vi.fn>;

		// Act
		fixture.componentInstance['search']();

		// Assert
		expect(facade['fetchVehiclesPage']).toHaveBeenLastCalledWith(0, 20);
		expect(navigate).toHaveBeenCalledWith(
			[],
			expect.objectContaining({ queryParams: { q: 'van', at: null, status: null, sort: null } }),
		);
	});
});
