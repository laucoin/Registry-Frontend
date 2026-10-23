import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectBirthdayComponent } from './project-birthday.component';

describe('ProjectBirthdayComponent', () => {
	let fixture: ComponentFixture<ProjectBirthdayComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectBirthdayComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectBirthdayComponent);
		await fixture.whenStable();
	});

	it('should list the birthdays of the day', () => {
		// Arrange
		const selector: string = 'sgdf-list-item';

		// Act
		const count: number = fixture.nativeElement.querySelectorAll(selector).length;

		// Assert
		expect(count).toBe(3);
	});
});
