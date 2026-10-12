import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectParticipantRegularizationComponent } from './project-participant-regularization.component';

describe('ProjectParticipantRegularizationComponent', () => {
	let fixture: ComponentFixture<ProjectParticipantRegularizationComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectParticipantRegularizationComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectParticipantRegularizationComponent);
		await fixture.whenStable();
	});

	it('should list the participants to regularize', () => {
		// Arrange
		const selector: string = 'sgdf-list-item';

		// Act
		const count: number = fixture.nativeElement.querySelectorAll(selector).length;

		// Assert
		expect(count).toBe(2);
	});
});
