import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectVehicleOverviewComponent } from './project-vehicle-overview.component';

describe('ProjectVehicleOverviewComponent', () => {
	let fixture: ComponentFixture<ProjectVehicleOverviewComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectVehicleOverviewComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectVehicleOverviewComponent);
		await fixture.whenStable();
	});

	it('should display the two vehicle counters', () => {
		// Arrange
		const elements: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-table-row:nth-child(2) strong'));

		// Act
		const values: string[] = elements.map((element: HTMLElement): string => element.textContent.trim());

		// Assert
		expect(values).toEqual(['3', '3']);
	});

	it('should display the total in the header tag', () => {
		// Arrange
		const tag: HTMLElement = fixture.nativeElement.querySelector('sgdf-tag');

		// Act
		const text: string = tag.textContent.trim();

		// Assert
		expect(text).toBe('projectHome.vehicleOverview.total');
	});
});
