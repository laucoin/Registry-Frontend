import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SessionFacade } from '@core/registry/state/session.facade';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { VehicleStatusModel } from '@shared/models/model/vehicle-status.model';
import { ProjectVehicleOverviewComponent } from './project-vehicle-overview.component';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';

const status: VehicleStatusModel = { present: 3, absent: 2, lastRefresh: new Date() };

describe('ProjectVehicleOverviewComponent', () => {
	let fixture: ComponentFixture<ProjectVehicleOverviewComponent>;
	let vehiclesStatus: WritableSignal<VehicleStatusModel | undefined>;
	let fetchVehiclesStatus: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vehiclesStatus = signal<VehicleStatusModel | undefined>(status);
		fetchVehiclesStatus = vi.fn();
		await MockBuilder(ProjectVehicleOverviewComponent).provide(REFRESH_SERVICE_STUB)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SelectedProjectFacade, useValue: { vehiclesStatus, fetchVehiclesStatus } })
			.provide({ provide: SessionFacade, useValue: { currentProjectId: signal('p1') } })
			.provide(provideRouter([]));
		fixture = TestBed.createComponent(ProjectVehicleOverviewComponent);
		await fixture.whenStable();
	});

	it('should load the vehicles status when displayed', () => {
		// Arrange
		const expected: number = 1;

		// Act
		const calls: number = fetchVehiclesStatus.mock.calls.length;

		// Assert
		expect(calls).toBe(expected);
	});

	it('should display the two vehicle counters', () => {
		// Arrange
		const elements: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-table-row:nth-child(2) strong'));

		// Act
		const values: string[] = elements.map((element: HTMLElement): string => element.textContent.trim());

		// Assert
		expect(values).toEqual(['3', '2']);
	});

	it('should display placeholders and no total while the status is not loaded', async () => {
		// Arrange
		vehiclesStatus.set(undefined);

		// Act
		await fixture.whenStable();
		const values: string[] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-table-row:nth-child(2) strong')).map((element: HTMLElement): string => element.textContent.trim());

		// Assert
		expect(values).toEqual(['–', '–']);
		expect(fixture.nativeElement.querySelector('sgdf-tag')).toBeNull();
	});

	it('should display the total in the header tag', () => {
		// Arrange
		const tag: HTMLElement = fixture.nativeElement.querySelector('sgdf-tag');

		// Act
		const text: string = tag.textContent.trim();

		// Assert
		expect(text).toBe('projectHome.vehicleOverview.total');
	});

	it('should hide the link when asked to', async () => {
		// Arrange
		fixture.componentRef.setInput('showLink', false);

		// Act
		await fixture.whenStable();
		const link: HTMLElement | null = fixture.nativeElement.querySelector('sgdf-button');

		// Assert
		expect(link).toBeNull();
	});

	it('should link to the vehicles page of the selected project', () => {
		// Arrange
		const selector: string = 'sgdf-button';

		// Act
		const target: string = ngMocks.input(selector, 'routerLink');

		// Assert
		expect(target).toBe('/projects/p1/vehicles');
	});
});
