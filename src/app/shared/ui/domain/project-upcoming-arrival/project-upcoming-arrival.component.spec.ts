import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectUpcomingArrivalComponent } from './project-upcoming-arrival.component';

describe('ProjectUpcomingArrivalComponent', () => {
	let fixture: ComponentFixture<ProjectUpcomingArrivalComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectUpcomingArrivalComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectUpcomingArrivalComponent);
		await fixture.whenStable();
	});

	it('should list the arrivals of the day', () => {
		// Arrange
		const selector: string = 'sgdf-list-item';

		// Act
		const count: number = fixture.nativeElement.querySelectorAll(selector).length;

		// Assert
		expect(count).toBe(3);
	});
});
