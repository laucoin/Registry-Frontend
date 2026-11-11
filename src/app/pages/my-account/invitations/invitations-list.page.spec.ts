import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { InvitationsListPage } from '@pages/my-account/invitations/invitations-list.page';
import { InvitationsListHarness } from '@pages/my-account/invitations/testing/invitations-list.harness';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { INVITATION_DTO } from '@shared/helpers/testing/response-fixtures';
import { UserInvitationMapper } from '@shared/mappers/user-invitation.mapper';

@Component({ template: '' })
class EmptyComponent {}

const EMPTY_PAGE = {
	content: [],
	page: 0,
	size: 20,
	totalElements: 0,
	totalPages: 0,
	hasNext: false,
	lastRefresh: new Date(),
};

describe('InvitationsListPage', () => {
	let facade: Record<string, unknown>;

	async function create(url = '/'): Promise<InvitationsListHarness> {
		await TestBed.inject(Router).navigateByUrl(url);
		const fixture = TestBed.createComponent(InvitationsListPage);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, InvitationsListHarness);
	}

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	beforeEach(() => {
		facade = {
			userProjectProfileInvitationsPage: signal(EMPTY_PAGE),
			userProjectProfileInvitationsPageError: signal(undefined),
			userProjectProfileInvitationsPageLoading: signal(false),
			userProjectProfileInvitationsPageSilentLoading: signal(false),
			userProjectProfileInvitationsPageQueryParam: signal(undefined),
			userProjectProfileInvitationsPageAtParam: signal(undefined),
			inputInvitationsPageSearchParameters: vi.fn(),
			fetchProjectProfileInvitationPage: vi.fn(),
		};
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { global: { list: { 'active-filters': '{{ count }}' } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				{ provide: UserProfileFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: ProjectProfileFacade, useValue: {} },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('loads the first batch with the default filters when the url carries none', async () => {
		// Arrange
		const harness = await create();

		// Act
		const searched = await harness.searchedText();

		// Assert
		expect([
			searched,
			calls('inputInvitationsPageSearchParameters'),
			calls('fetchProjectProfileInvitationPage'),
		]).toEqual(['', [[undefined, undefined, undefined]], [[undefined, undefined]]]);
	});

	it('starts from the filters carried by the url', async () => {
		// Arrange
		const harness = await create('/?q=camp&at=2026-01-02T00:00:00.000Z');

		// Act
		const searched = await harness.searchedText();

		// Assert
		expect([searched, calls('inputInvitationsPageSearchParameters')[0]]).toEqual([
			'camp',
			['camp', new Date('2026-01-02T00:00:00.000Z'), undefined],
		]);
	});

	it('searches the typed text from the first batch and writes it in the url', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.search('camp');

		// Assert
		expect([
			calls('inputInvitationsPageSearchParameters').at(-1),
			calls('fetchProjectProfileInvitationPage').at(-1),
			TestBed.inject(Router).url,
		]).toEqual([['camp', undefined, undefined], [0, undefined], '/?q=camp']);
	});

	it.each([
		{ name: 'no filter', query: undefined, at: undefined, expected: undefined },
		{ name: 'a searched text', query: 'camp', at: undefined, expected: '1' },
		{ name: 'a searched text and a date', query: 'camp', at: new Date(), expected: '2' },
	])('counts the active filters with $name', async ({ query, at, expected }) => {
		// Arrange
		(facade['userProjectProfileInvitationsPageQueryParam'] as ReturnType<typeof signal>).set(query);
		(facade['userProjectProfileInvitationsPageAtParam'] as ReturnType<typeof signal>).set(at);
		const harness = await create();

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe(expected);
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		(facade['userProjectProfileInvitationsPageQueryParam'] as ReturnType<typeof signal>).set('camp');
		const harness = await create('/?q=camp');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await harness.searchedText(), calls('inputInvitationsPageSearchParameters').at(-1)]).toEqual([
			'',
			[undefined, undefined, undefined],
		]);
	});

	it.each([
		{
			name: 'create a project',
			act: (harness: InvitationsListHarness) => harness.createProject(),
			url: '/projects/create',
		},
		{
			name: 'browse the projects',
			act: (harness: InvitationsListHarness) => harness.openProjects(),
			url: '/projects',
		},
	])('offers to $name when the user has no invitation', async ({ act, url }) => {
		// Arrange
		const harness = await create();
		const shown = await harness.emptyShown();

		// Act
		await act(harness);

		// Assert
		expect([shown, TestBed.inject(Router).url]).toEqual([true, url]);
	});

	it('asks for the next batch when the list asks for it', async () => {
		// Arrange
		(facade['userProjectProfileInvitationsPage'] as ReturnType<typeof signal>).set({
			...EMPTY_PAGE,
			content: [UserInvitationMapper.toModel(INVITATION_DTO)],
			totalElements: 40,
			totalPages: 2,
			hasNext: true,
		});
		const harness = await create();

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect(calls('fetchProjectProfileInvitationPage').at(-1)).toEqual([1, 20]);
	});
});
