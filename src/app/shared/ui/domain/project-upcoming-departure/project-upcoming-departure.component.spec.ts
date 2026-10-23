import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectUpcomingDepartureComponent } from './project-upcoming-departure.component';

describe('ProjectUpcomingDepartureComponent', () => {
	let fixture: ComponentFixture<ProjectUpcomingDepartureComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectUpcomingDepartureComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectUpcomingDepartureComponent);
		await fixture.whenStable();
	});

	it('should list the departures of the day', () => {
		// Arrange
		const selector: string = 'sgdf-list-item';

		// Act
		const count: number = fixture.nativeElement.querySelectorAll(selector).length;

		// Assert
		expect(count).toBe(3);
	});
});
