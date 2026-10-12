import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectActiveAlertComponent } from './project-active-alert.component';

describe('ProjectActiveAlertComponent', () => {
	let fixture: ComponentFixture<ProjectActiveAlertComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectActiveAlertComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectActiveAlertComponent);
		await fixture.whenStable();
	});

	it('should display one callout per open alert', () => {
		// Arrange
		const selector: string = 'sgdf-callout';

		// Act
		const count: number = fixture.nativeElement.querySelectorAll(selector).length;

		// Assert
		expect(count).toBe(3);
	});
});
