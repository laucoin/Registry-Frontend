import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SessionFacade } from '@core/registry/state/session.facade';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { ProjectStatusModel } from '@shared/models/model/project-status.model';
import { ProjectParticipantOverviewComponent } from './project-participant-overview.component';

const status: ProjectStatusModel = { registered: { presentMinors: 50, presentMajors: 74, absentMinors: 1, absentMajors: 1 }, guests: 2, lastRefresh: new Date() };

describe('ProjectParticipantOverviewComponent', () => {
	let fixture: ComponentFixture<ProjectParticipantOverviewComponent>;
	let participantsStatus: WritableSignal<ProjectStatusModel | undefined>;
	let fetchParticipantsStatus: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		participantsStatus = signal<ProjectStatusModel | undefined>(status);
		fetchParticipantsStatus = vi.fn();
		await MockBuilder(ProjectParticipantOverviewComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.provide({ provide: SelectedProjectFacade, useValue: { participantsStatus, fetchParticipantsStatus } })
			.provide({ provide: SessionFacade, useValue: { currentProjectId: signal('p1') } })
			.provide(provideRouter([]));
		fixture = TestBed.createComponent(ProjectParticipantOverviewComponent);
		await fixture.whenStable();
	});

	it('should load the participants status when displayed', () => {
		// Arrange
		const expected: number = 1;

		// Act
		const calls: number = fetchParticipantsStatus.mock.calls.length;

		// Assert
		expect(calls).toBe(expected);
	});

	it('should display the three participant counters', () => {
		// Arrange
		const elements: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-table-row:nth-child(2) strong'));

		// Act
		const values: string[] = elements.map((element: HTMLElement): string => element.textContent.trim());

		// Assert
		expect(values).toEqual(['124', '2', '2']);
	});

	it('should display placeholders and no total while the status is not loaded', async () => {
		// Arrange
		participantsStatus.set(undefined);

		// Act
		await fixture.whenStable();
		const values: string[] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-table-row:nth-child(2) strong')).map((element: HTMLElement): string => element.textContent.trim());

		// Assert
		expect(values).toEqual(['–', '–', '–']);
		expect(fixture.nativeElement.querySelector('sgdf-tag')).toBeNull();
	});

	it('should display the total in the header tag', () => {
		// Arrange
		const tag: HTMLElement = fixture.nativeElement.querySelector('sgdf-tag');

		// Act
		const text: string = tag.textContent.trim();

		// Assert
		expect(text).toBe('projectHome.participantOverview.total');
	});

	it('should link to the participants page of the selected project', () => {
		// Arrange
		const selector: string = 'sgdf-button';

		// Act
		const target: string = ngMocks.input(selector, 'routerLink');

		// Assert
		expect(target).toBe('/projects/p1/participants');
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
});
