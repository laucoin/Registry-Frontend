import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import { ProjectProfilesListPage } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.page';
import { ProjectProfilesListHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/testing/project-profiles-list.harness';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectProfileModel } from '@shared/models/model/project-profile.model';

@Component({ template: '' })
class EmptyComponent {}

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

const pageOf = (ids: string[], hasNext = false): PageModel<ProjectProfileModel> => ({
	content: ids.map(
		(id) =>
			({
				id,
				visible: true,
				user: { id: `u-${id}`, firstName: id, lastName: 'Doe', email: `${id}@x.test` },
				role: { value: 'MEMBER', label: 'Member' },
				status: { value: 'ACCEPTED', label: 'Accepted' },
			}) as unknown as ProjectProfileModel,
	),
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : ids.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

describe('ProjectProfilesListPage', () => {
	let facade: Record<string, Mock>;
	let authorities: WritableSignal<string[]>;

	const calls = (name: string): unknown[][] => facade[name].mock.calls;
	const param = (name: string, value: unknown): void =>
		(facade[name] as unknown as WritableSignal<unknown>).set(value);

	async function create(
		page: PageModel<ProjectProfileModel> | undefined,
		url = '/',
	): Promise<ProjectProfilesListHarness> {
		param('projectProfilesPage', page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectProfilesListPage),
			ProjectProfilesListHarness,
		);
	}

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_PROFILE_C']);
		facade = Object.assign(autoMock(undefined), {
			projectProfilesPage: signal(undefined),
			projectProfilesPageError: signal(undefined),
			projectProfilesPageLoading: signal(false),
			projectProfilesPageSilentLoading: signal(false),
			projectProfilesPageQueryParam: signal(undefined),
			projectProfilesPageAtParam: signal(undefined),
			projectProfilesPageStatusParam: signal(undefined),
			projectProfilesPageIsAvailableParam: signal(undefined),
			projectProfilesPageIsVisibleParam: signal(undefined),
			projectProfilesStatusMetadata: signal([]),
			projectProfilesAvailabilitiesMetadata: signal(CHOICES),
			projectProfilesVisibilitiesMetadata: signal(CHOICES),
			fetchProjectProfilesPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		}) as unknown as Record<string, Mock>;
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
				REFRESH_SERVICE_STUB,
				{ provide: ProjectProfileFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: authorities() }),
						selectedProject: signal({ id: 'p1' }),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UserProfileFacade, useValue: { toggleProjectFavorite: vi.fn() } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), confirm: vi.fn() } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('shows its title and loads the first batch when the url carries no filter', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const title = await harness.title();

		// Assert
		expect([title, calls('inputPageSearchParameters'), calls('fetchProjectProfilesPage')]).toEqual([
			'project-profiles.pages.project.title',
			[[undefined, undefined, undefined, undefined, undefined, undefined]],
			[[undefined, undefined]],
		]);
	});

	it('starts from the text and the sort carried by the url', async () => {
		// Arrange
		const harness = await create(undefined, '/?q=hike&sort=-status');

		// Act
		const searched = await (await harness.search()).searchedText();

		// Assert
		expect([searched, calls('inputPageSearchParameters')[0]]).toEqual([
			'hike',
			['hike', undefined, undefined, undefined, undefined, '-status'],
		]);
	});

	it('searches the typed text from the first batch and writes it in the url', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await (await harness.search()).search('hike');

		// Assert
		expect([calls('fetchProjectProfilesPage').at(-1), TestBed.inject(Router).url]).toEqual([
			[0, undefined],
			'/?q=hike',
		]);
	});

	it('counts every applied filter', async () => {
		// Arrange
		param('projectProfilesPageQueryParam', 'hike');
		param('projectProfilesPageAtParam', new Date());
		param('projectProfilesPageStatusParam', 'ACCEPTED');
		param('projectProfilesPageIsAvailableParam', true);
		param('projectProfilesPageIsVisibleParam', false);
		const harness = await create(pageOf([]));

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe('5');
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		param('projectProfilesPageQueryParam', 'hike');
		const harness = await create(pageOf([]), '/?q=hike');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await (await harness.search()).searchedText(), calls('fetchProjectProfilesPage').at(-1)]).toEqual([
			'',
			[0, undefined],
		]);
	});

	it('shows one row per element and asks for the next batch when the list asks for it', async () => {
		// Arrange
		const harness = await create(pageOf(['e1', 'e2'], true));

		// Act
		await (await (await harness.list()).loadMore())?.loadMore();

		// Assert
		expect([await harness.rows(), calls('fetchProjectProfilesPage').at(-1)]).toEqual([
			['e1', 'e2'],
			[1, 20],
		]);
	});

	it.each([
		{
			name: 'offers the invitation to a user who invites',
			granted: ['p1_REGISTRY_PROJECT_PROFILE_C'],
			shown: true,
		},
		{ name: 'hides the invitation from the others', granted: [], shown: false },
	])('$name', async ({ granted, shown }) => {
		// Arrange
		authorities.set(granted);
		const harness = await create(pageOf([]));

		// Act
		const offered = await harness.canCreate();

		// Assert
		expect(offered).toBe(shown);
	});

	it('opens the invitation form', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await harness.create();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/invite');
	});
});
