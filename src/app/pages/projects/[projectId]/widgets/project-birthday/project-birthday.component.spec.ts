import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ProjectBirthdayComponent } from '@pages/projects/[projectId]/widgets/project-birthday/project-birthday.component';
import { ProjectBirthdayHarness } from '@pages/projects/[projectId]/widgets/project-birthday/testing/project-birthday.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const TRANSLATIONS = {
	projectHome: {
		birthday: {
			title: 'Birthdays',
			empty: 'Nobody',
			age: '{{ count }} years',
			total: { one: '{{ count }} today', few: '{{ count }} today' },
			more: { one: '{{ count }} more', few: '{{ count }} more' },
		},
	},
};

const participant = (index: number, overrides: Partial<ParticipantModel> = {}): ParticipantModel => ({
	...ParticipantMapper.toModel(PARTICIPANT_DTO),
	id: `pa${index}`,
	firstName: `First${index}`,
	lastName: 'Last',
	...overrides,
});

describe('ProjectBirthdayComponent', () => {
	let birthdays: WritableSignal<ParticipantModel[] | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetch: Mock<() => void>;
	let refresh: Mock<() => void>;
	let reloads: (() => void)[];

	function create(): Promise<ProjectBirthdayHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectBirthdayComponent),
			ProjectBirthdayHarness,
		);
	}

	beforeEach(() => {
		birthdays = signal<ParticipantModel[] | undefined>(undefined);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		fetch = vi.fn();
		refresh = vi.fn();
		reloads = [];
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: TRANSLATIONS },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
					},
				},
				{
					provide: SelectedProjectFacade,
					useValue: {
						participantsBirthdays: birthdays,
						participantsBirthdaysLoading: loading,
						participantsBirthdaysError: error,
						fetchParticipantsBirthdays: fetch,
						refreshParticipantsBirthdays: refresh,
					},
				},
			],
		});
	});

	it('loads the birthdays and shows the skeleton until they arrive', async () => {
		// Arrange
		loading.set(true);

		// Act
		const harness = await create();

		// Assert
		expect([
			await harness.title(),
			(await harness.skeleton()) !== null,
			await harness.total(),
			fetch.mock.calls.length,
		]).toEqual(['Birthdays', true, undefined, 1]);
	});

	it('tells that nobody has a birthday today', async () => {
		// Arrange
		birthdays.set([]);

		// Act
		const harness = await create();

		// Assert
		expect([await harness.empty(), await harness.total()]).toEqual(['Nobody', '0 today']);
	});

	it('lists the first five birthdays with their age and detail, and counts the others', async () => {
		// Arrange
		const today = new Date();
		const birthday = `${today.getFullYear() - 10}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
		birthdays.set([
			participant(0, { birthday: birthday as never }),
			...Array.from({ length: 6 }, (_, index) => participant(index + 1, { birthday: 'unknown' })),
		]);

		// Act
		const harness = await create();
		const rows = await harness.rows();

		// Assert
		expect([rows.length, rows[0], rows[1], await harness.more(), await harness.total()]).toEqual([
			5,
			{ name: 'First0 LAST', detail: '10 years · Registered' },
			{ name: 'First1 LAST', detail: 'Registered' },
			'2 more',
			'7 today',
		]);
	});

	it('shows the failure and loads again on retry', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		const harness = await create();

		// Act
		await (await harness.error())?.retry();

		// Assert
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('refreshes silently when the refresh service asks', async () => {
		// Arrange
		await create();

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
