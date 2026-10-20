import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PlannedMovementModel } from '@shared/models/model/planned-movement.model';
import { ProjectUpcomingArrivalComponent } from './project-upcoming-arrival.component';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';

describe('ProjectUpcomingArrivalComponent', () => {
	let fixture: ComponentFixture<ProjectUpcomingArrivalComponent>;
	let movements: WritableSignal<PlannedMovementModel[] | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let load: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		movements = signal<PlannedMovementModel[] | undefined>([]);
		loading = signal(true);
		error = signal<NotificationModel | undefined>(undefined);
		load = vi.fn();
		await MockBuilder(ProjectUpcomingArrivalComponent).provide(REFRESH_SERVICE_STUB).provide({
			provide: SelectedProjectFacade,
			useValue: { plannedArrivals: movements, plannedArrivalsLoading: loading, plannedArrivalsError: error, fetchPlannedArrivals: load },
		});
		fixture = TestBed.createComponent(ProjectUpcomingArrivalComponent);
		await fixture.whenStable();
	});

	it('should load the planned arrivals when displayed', () => {
		// Arrange
		const expected: number = 1;

		// Act
		const calls: number = load.mock.calls.length;

		// Assert
		expect(calls).toBe(expected);
	});

	it('should give the state of the arrivals to the planned movement card', () => {
		// Arrange
		const selector: string = 'app-planned-movement-card';

		// Act
		const given: PlannedMovementModel[] = ngMocks.input(selector, 'movements');
		const isLoading: boolean = ngMocks.input(selector, 'loading');

		// Assert
		expect(given).toEqual([]);
		expect(isLoading).toBe(true);
	});

	it('should name the card after the arrivals', () => {
		// Arrange
		const selector: string = 'app-planned-movement-card';

		// Act
		const title: string = ngMocks.input(selector, 'titleKey');
		const empty: string = ngMocks.input(selector, 'emptyKey');

		// Assert
		expect(title).toBe('projectHome.upcomingArrival.title');
		expect(empty).toBe('projectHome.upcomingArrival.empty');
	});

	it('should load the arrivals again when the card asks for a retry', () => {
		// Arrange
		const selector: string = 'app-planned-movement-card';

		// Act
		ngMocks.output(selector, 'retry').emit();

		// Assert
		expect(load).toHaveBeenCalledTimes(2);
	});
});
