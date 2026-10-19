import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, pageOf } from '@shared/helpers/testing/test-fixtures';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ProjectParticipantRegularizationComponent } from './project-participant-regularization.component';

function participant(id: string): ParticipantModel {
	return {
		...ParticipantMapper.toModel(PARTICIPANT_DTO),
		id,
		firstName: `Name${id}`,
		effectiveArrival: new Date(Date.now() - 2 * 24 * 3600 * 1000),
	};
}

describe('ProjectParticipantRegularizationComponent', () => {
	let fixture: ComponentFixture<ProjectParticipantRegularizationComponent>;
	let page: WritableSignal<PageModel<ParticipantModel> | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetchOverdueParticipantsPage: ReturnType<typeof vi.fn>;

	async function render(): Promise<void> {
		fixture = TestBed.createComponent(ProjectParticipantRegularizationComponent);
		await fixture.whenStable();
	}

	beforeEach(async () => {
		page = signal<PageModel<ParticipantModel> | undefined>(undefined);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		fetchOverdueParticipantsPage = vi.fn();
		await MockBuilder(ProjectParticipantRegularizationComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.provide({
				provide: SelectedProjectFacade,
				useValue: { overdueParticipantsPage: page, overdueParticipantsPageLoading: loading, overdueParticipantsPageError: error, fetchOverdueParticipantsPage },
			});
	});

	it('should load the first participants to regularize when displayed', async () => {
		// Arrange
		page.set(pageOf<ParticipantModel>([]));

		// Act
		await render();

		// Assert
		expect(fetchOverdueParticipantsPage).toHaveBeenCalledWith(0, 5);
	});

	it('should list the participants to regularize with their total', async () => {
		// Arrange
		page.set({ ...pageOf([participant('a'), participant('b')]), totalElements: 2 });

		// Act
		await render();
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;
		const total: string = fixture.nativeElement.querySelector('sgdf-tag').textContent.trim();

		// Assert
		expect(rows).toBe(2);
		expect(total).toBe('projectHome.participantRegularization.total');
	});

	it('should count the participants that are not shown', async () => {
		// Arrange
		page.set({ ...pageOf([participant('a')]), totalElements: 7 });

		// Act
		await render();
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.participantRegularization.seeRemaining');
	});

	it('should say there is nothing to regularize', async () => {
		// Arrange
		page.set(pageOf<ParticipantModel>([]));

		// Act
		await render();
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.participantRegularization.empty');
		expect(fixture.nativeElement.querySelector('sgdf-list-item')).toBeNull();
	});

	it('should display skeleton rows while the participants load', async () => {
		// Arrange
		loading.set(true);

		// Act
		await render();
		const skeletons: number = fixture.nativeElement.querySelectorAll('sgdf-skeleton[shape="rounded"]').length;

		// Assert
		expect(skeletons).toBe(3);
	});

	it('should display the failure and load the participants again when retrying', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		await render();

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(fixture.nativeElement.querySelector('app-section-error')).not.toBeNull();
		expect(fetchOverdueParticipantsPage).toHaveBeenCalledTimes(2);
	});

	it('should open the dialog listing all of them instead of leaving the page', async () => {
		// Arrange
		page.set(pageOf<ParticipantModel>([]));
		await render();
		const closed: boolean = ngMocks.input('app-overdue-participants-dialog', 'open');

		// Act
		ngMocks.click('sgdf-button');
		fixture.detectChanges();

		// Assert
		expect(closed).toBe(false);
		expect(ngMocks.input('app-overdue-participants-dialog', 'open')).toBe(true);
	});
});
