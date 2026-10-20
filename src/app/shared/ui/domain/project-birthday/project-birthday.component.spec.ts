import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { ProjectBirthdayComponent } from './project-birthday.component';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';

function participants(count: number): ParticipantModel[] {
	return Array.from({ length: count }, (_: unknown, index: number): ParticipantModel => ({ ...ParticipantMapper.toModel(PARTICIPANT_DTO), id: `p${index}`, firstName: `Name${index}` }));
}

describe('ProjectBirthdayComponent', () => {
	let fixture: ComponentFixture<ProjectBirthdayComponent>;
	let birthdays: WritableSignal<ParticipantModel[] | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetchParticipantsBirthdays: ReturnType<typeof vi.fn>;

	async function render(): Promise<void> {
		fixture = TestBed.createComponent(ProjectBirthdayComponent);
		await fixture.whenStable();
	}

	beforeEach(async () => {
		birthdays = signal<ParticipantModel[] | undefined>(undefined);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		fetchParticipantsBirthdays = vi.fn();
		await MockBuilder(ProjectBirthdayComponent).provide(REFRESH_SERVICE_STUB)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key)
			.provide({
				provide: SelectedProjectFacade,
				useValue: { participantsBirthdays: birthdays, participantsBirthdaysLoading: loading, participantsBirthdaysError: error, fetchParticipantsBirthdays },
			});
	});

	it('should load the birthdays when displayed', async () => {
		// Arrange
		birthdays.set([]);

		// Act
		await render();

		// Assert
		expect(fetchParticipantsBirthdays).toHaveBeenCalledTimes(1);
	});

	it('should list the participants whose birthday is today with their total', async () => {
		// Arrange
		birthdays.set(participants(3));

		// Act
		await render();
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;
		const total: string = fixture.nativeElement.querySelector('sgdf-tag').textContent.trim();

		// Assert
		expect(rows).toBe(3);
		expect(total).toBe('projectHome.birthday.total');
	});

	it('should show only the first birthdays and count the others', async () => {
		// Arrange
		birthdays.set(participants(8));

		// Act
		await render();
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(rows).toBe(5);
		expect(text).toContain('projectHome.birthday.more');
	});

	it('should tell that nobody has a birthday today', async () => {
		// Arrange
		birthdays.set([]);

		// Act
		await render();
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.birthday.empty');
		expect(fixture.nativeElement.querySelector('sgdf-list-item')).toBeNull();
	});

	it('should display skeleton rows while the birthdays load', async () => {
		// Arrange
		loading.set(true);

		// Act
		await render();
		const skeletons: number = fixture.nativeElement.querySelectorAll('sgdf-skeleton[shape="rounded"]').length;

		// Assert
		expect(skeletons).toBe(3);
		expect(fixture.nativeElement.querySelector('sgdf-tag')).toBeNull();
	});

	it('should display the failure and load the birthdays again when retrying', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		await render();

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(fixture.nativeElement.querySelector('app-section-error')).not.toBeNull();
		expect(fetchParticipantsBirthdays).toHaveBeenCalledTimes(2);
	});

	it('should show the age and the group of a participant', async () => {
		// Arrange
		const today: number = new Date().getFullYear();
		birthdays.set([{ ...ParticipantMapper.toModel(PARTICIPANT_DTO), birthday: `${today - 12}-01-01` }]);

		// Act
		await render();
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.birthday.age');
		expect(text).toContain('Registered');
	});

	it('should list a participant whose status the backend does not send', async () => {
		// Arrange
		birthdays.set([{ ...ParticipantMapper.toModel(PARTICIPANT_DTO), status: undefined as never, groups: undefined }]);

		// Act
		await render();
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;

		// Assert
		expect(rows).toBe(1);
	});
});
