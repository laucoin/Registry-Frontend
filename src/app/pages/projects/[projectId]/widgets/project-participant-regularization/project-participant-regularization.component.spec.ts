import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { UiFacade } from '@core/registry/state/ui.facade';
import { ProjectParticipantRegularizationComponent } from '@pages/projects/[projectId]/widgets/project-participant-regularization/project-participant-regularization.component';
import { ProjectParticipantRegularizationHarness } from '@pages/projects/[projectId]/widgets/project-participant-regularization/testing/project-participant-regularization.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const TRANSLATIONS = {
	projectHome: {
		participantRegularization: {
			title: 'Overdue',
			empty: 'None',
			seeAll: 'See all',
			total: { one: '{{ count }} overdue', few: '{{ count }} overdue' },
			seeRemaining: { one: 'See {{ count }} more', few: 'See {{ count }} more' },
		},
	},
};

const pageOf = (count: number, totalElements: number): PageModel<ParticipantModel> => ({
	content: Array.from({ length: count }, (_, index) => ({
		...ParticipantMapper.toModel(PARTICIPANT_DTO),
		id: `pa${index}`,
	})),
	page: 0,
	size: 3,
	totalElements,
	totalPages: 1,
	hasNext: false,
	lastRefresh: new Date(),
});

describe('ProjectParticipantRegularizationComponent', () => {
	let page: WritableSignal<PageModel<ParticipantModel> | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetch: Mock<(page: number, size: number) => void>;
	let refresh: Mock<() => void>;
	let reloads: (() => void)[];

	function create(): Promise<ProjectParticipantRegularizationHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectParticipantRegularizationComponent),
			ProjectParticipantRegularizationHarness,
		);
	}

	beforeEach(() => {
		page = signal<PageModel<ParticipantModel> | undefined>(undefined);
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
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				PluralTranslationPipe,
				{ provide: MovementPrefillService, useValue: { creationUrl: (): undefined => undefined } },
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
						overdueParticipantsPage: page,
						overdueParticipantsPageLoading: loading,
						overdueParticipantsPageError: error,
						fetchOverdueParticipantsPage: fetch,
						refreshOverdueParticipantsPage: refresh,
						overdueParticipantsListPage: signal(undefined),
						overdueParticipantsListError: signal(undefined),
						overdueParticipantsListLoading: signal(false),
						overdueParticipantsListSilentLoading: signal(false),
						fetchOverdueParticipantsListPage: vi.fn(),
					},
				},
			],
		});
	});

	it('loads the first participants and shows the skeleton until they arrive', async () => {
		// Arrange
		loading.set(true);

		// Act
		const harness = await create();

		// Assert
		expect([await harness.title(), (await harness.skeleton()) !== null, fetch.mock.calls]).toEqual([
			'Overdue',
			true,
			[[0, 5]],
		]);
	});

	it.each([
		{ name: 'nobody to regularize', page: pageOf(0, 0), rows: 0, empty: 'None', seeAll: 'See all' },
		{ name: 'every participant to regularize', page: pageOf(2, 2), rows: 2, empty: undefined, seeAll: 'See all' },
		{
			name: 'the first participants and offers the others',
			page: pageOf(3, 5),
			rows: 3,
			empty: undefined,
			seeAll: 'See 2 more',
		},
	])('shows $name', async ({ page: shown, rows, empty, seeAll }) => {
		// Arrange
		page.set(shown);

		// Act
		const harness = await create();

		// Assert
		expect([(await harness.rows()).length, await harness.empty(), await harness.seeAllText()]).toEqual([
			rows,
			empty,
			seeAll,
		]);
	});

	it('opens the complete list in a dialog', async () => {
		// Arrange
		page.set(pageOf(5, 7));
		const harness = await create();

		// Act
		await harness.seeAll();

		// Assert
		expect(await (await harness.dialog()).isOpen()).toBe(true);
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
