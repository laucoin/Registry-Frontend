import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { ProjectParticipantOverviewComponent } from './project-participant-overview.component';

describe('ProjectParticipantOverviewComponent', () => {
	let fixture: ComponentFixture<ProjectParticipantOverviewComponent>;

	beforeEach(async () => {
		await MockBuilder(ProjectParticipantOverviewComponent).mock(TranslocoPipe, (key: string): string => key);
		fixture = TestBed.createComponent(ProjectParticipantOverviewComponent);
		await fixture.whenStable();
	});

	it('should display the three participant counters', () => {
		// Arrange
		const elements: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-table-row:nth-child(2) strong'));

		// Act
		const values: string[] = elements.map((element: HTMLElement): string => element.textContent.trim());

		// Assert
		expect(values).toEqual(['124', '2', '2']);
	});

	it('should display the total in the header tag', () => {
		// Arrange
		const tag: HTMLElement = fixture.nativeElement.querySelector('sgdf-tag');

		// Act
		const text: string = tag.textContent.trim();

		// Assert
		expect(text).toBe('projectHome.participantOverview.total');
	});
});
