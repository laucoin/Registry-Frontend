import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { HomeInvitationsComponent } from '@pages/home/widgets/home-invitations/home-invitations.component';
import { HomeInvitationsHarness } from '@pages/home/widgets/home-invitations/testing/home-invitations.harness';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { INVITATION_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { UserInvitationMapper } from '@shared/mappers/user-invitation.mapper';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';

@Component({ template: '' })
class EmptyComponent {}

const TRANSLATIONS = {
	home: {
		invitations: {
			title: 'Invitations',
			empty: 'None',
			invitedAs: 'as {{ role }}',
			pending: { one: '{{ count }} pending', few: '{{ count }} pending' },
		},
	},
};

const invitations = (count: number): UserInvitationModel[] =>
	Array.from({ length: count }, (_, index) => ({
		...UserInvitationMapper.toModel(INVITATION_DTO),
		id: `i${index}`,
		project: { ...UserInvitationMapper.toModel(INVITATION_DTO).project, name: `Camp ${index}` },
	})) as UserInvitationModel[];

const pageOf = (content: UserInvitationModel[], totalElements = content.length): PageModel<UserInvitationModel> => ({
	content,
	page: 0,
	size: 3,
	totalElements,
	totalPages: 1,
	hasNext: false,
	lastRefresh: new Date(),
});

describe('HomeInvitationsComponent', () => {
	let page: WritableSignal<PageModel<UserInvitationModel> | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetch: Mock<(page: number, size: number) => void>;
	let manage: Mock<(id: string, accepted: boolean) => void>;
	let refresh: Mock<() => void>;
	let confirm: Mock<(prefix: string, element: unknown, severity: SeverityEnum, accept: () => void) => void>;

	async function create(): Promise<HomeInvitationsHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(HomeInvitationsComponent),
			HomeInvitationsHarness,
		);
	}

	let reloads: (() => void)[];

	beforeEach(() => {
		reloads = [];
		page = signal<PageModel<UserInvitationModel> | undefined>(undefined);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		fetch = vi.fn();
		manage = vi.fn();
		refresh = vi.fn();
		confirm = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: TRANSLATIONS },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
					},
				},
				{ provide: ElementConfirmationService, useValue: { confirm } },
				{
					provide: UserProfileFacade,
					useValue: {
						userProjectProfileInvitationsPage: page,
						userProjectProfileInvitationsPageLoading: loading,
						userProjectProfileInvitationsPageError: error,
						fetchProjectProfileInvitationPage: fetch,
						manageProjectInvitationAcceptance: manage,
						refreshProjectProfileInvitationPage: refresh,
					},
				},
			],
		});
	});

	it('loads the first invitations when displayed', async () => {
		// Arrange
		const harness = await create();

		// Act
		const title = await harness.title();

		// Assert
		expect([title, fetch.mock.calls]).toEqual(['Invitations', [[0, 3]]]);
	});

	it('shows the loading state until the first page arrives', async () => {
		// Arrange
		loading.set(true);

		// Act
		const harness = await create();

		// Assert
		expect([await harness.loadingShown(), await harness.total(), await harness.empty()]).toEqual([
			true,
			undefined,
			undefined,
		]);
	});

	it('tells that no invitation is pending', async () => {
		// Arrange
		page.set(pageOf([]));

		// Act
		const harness = await create();

		// Assert
		expect([await harness.empty(), await harness.total()]).toEqual(['None', '0 pending']);
	});

	it('shows no more than three invitations and counts all of them', async () => {
		// Arrange
		page.set(pageOf(invitations(5)));

		// Act
		const harness = await create();

		// Assert
		expect([await harness.invitations(), await harness.total()]).toEqual([
			[
				{ project: 'Camp 0', role: 'as Chief' },
				{ project: 'Camp 1', role: 'as Chief' },
				{ project: 'Camp 2', role: 'as Chief' },
			],
			'5 pending',
		]);
	});

	it.each([
		{
			name: 'refusing',
			act: (harness: HomeInvitationsHarness) => harness.refuse(0),
			key: 'REJECTED',
			severity: SeverityEnum.DANGER,
			accepted: false,
		},
		{
			name: 'accepting',
			act: (harness: HomeInvitationsHarness) => harness.accept(0),
			key: 'ACCEPTED',
			severity: SeverityEnum.SUCCESS,
			accepted: true,
		},
	])(
		'asks for a confirmation before $name an invitation, then answers it',
		async ({ act, key, severity, accepted }) => {
			// Arrange
			page.set(pageOf(invitations(1)));
			const harness = await create();

			// Act
			await act(harness);
			const answeredBefore = manage.mock.calls.length;
			confirm.mock.calls[0][3]();

			// Assert
			expect([confirm.mock.calls[0].slice(0, 3), answeredBefore, manage.mock.calls]).toEqual([
				[`project-profiles.actions.confirmations.${key}`, expect.objectContaining({ id: 'i0' }), severity],
				0,
				[['i0', accepted]],
			]);
		},
	);

	it('opens every invitation from the see all link', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.seeAll();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/my-account/invitations');
	});

	it('shows the section error and retries on demand', async () => {
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
