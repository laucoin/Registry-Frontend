import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectOperationalMonitoringComponent } from './project-operational-monitoring.component';

describe('ProjectOperationalMonitoringComponent', () => {
	let fixture: ComponentFixture<ProjectOperationalMonitoringComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectOperationalMonitoringComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectOperationalMonitoringComponent);
		await fixture.whenStable();
	});

	it('should display one tab per monitoring section', () => {
		// Arrange
		const selector: string = 'sgdf-tab';

		// Act
		const count: number = fixture.nativeElement.querySelectorAll(selector).length;

		// Assert
		expect(count).toBe(5);
	});
});
