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
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectsListPage } from '@pages/projects/projects-list/projects-list.page';
import {
	ProjectsListDialogEnum,
	ProjectsListHarness,
} from '@pages/projects/projects-list/testing/projects-list.harness';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ProjectMapper } from '@shared/mappers/project.mapper';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { PageModel } from '@shared/models/model/page.model';
import { ProjectModel } from '@shared/models/model/project.model';

@Component({ template: '' })
class EmptyComponent {}

const project = (overrides: Partial<ProjectModel> = {}): ProjectModel => ({
	...ProjectMapper.toModel(PROJECT_DTO),
	...overrides,
});

const pageOf = (content: ProjectModel[], hasNext = false): PageModel<ProjectModel> => ({
	content,
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : content.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

const ALL = ['REGISTRY_PROJECT_C', 'REGISTRY_PROJECT_R', 'p1_REGISTRY_PROJECT_R'];
const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

describe('ProjectsListPage', () => {
	let facade: Record<string, unknown>;
	let authorities: WritableSignal<string[]>;
	let reloads: (() => void)[];

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;
	const param = (name: string, value: unknown): void => (facade[name] as WritableSignal<unknown>).set(value);

	async function create(page: PageModel<ProjectModel> | undefined, url = '/'): Promise<ProjectsListHarness> {
		param('projectsPage', page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectsListPage),
			ProjectsListHarness,
		);
	}

	beforeEach(() => {
		reloads = [];
		authorities = signal(ALL);
		facade = {
			projectsPage: signal(undefined),
			projectsPageError: signal(undefined),
			projectsPageLoading: signal(false),
			projectsPageSilentLoading: signal(false),
			projectsPageQueryParam: signal(undefined),
			projectsPageAtParam: signal(undefined),
			projectsPageIsVisibleParam: signal(undefined),
			projectsPageIsFavoriteParam: signal(undefined),
			projectsPageWithProfileParam: signal(undefined),
			visibilitiesMetadata: signal(CHOICES),
			favoritesMetadata: signal(CHOICES),
			withProfilesMetadata: signal(CHOICES),
			inputPageSearchParameters: vi.fn(),
			fetchProjectsPage: vi.fn(),
			refreshProjectsPage: vi.fn(),
			toggleFavorite: vi.fn(),
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
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
					},
				},
				{ provide: ProjectFacade, useValue: facade },
				{ provide: UserProfileFacade, useValue: { createSupportProjectProfile: vi.fn() } },
				{ provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }) } },
				{ provide: ElementConfirmationService, useValue: { confirm: vi.fn() } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	describe('search', () => {
		it('loads the first batch of the projects with a profile when the url carries no filter', async () => {
			// Arrange
			const harness = await create(undefined);

			// Act
			const title = await harness.title();

			// Assert
			expect([title, calls('inputPageSearchParameters'), calls('fetchProjectsPage')]).toEqual([
				'projects.list.title',
				[[undefined, undefined, undefined, undefined, true, undefined]],
				[[undefined, undefined]],
			]);
		});

		it('starts from the filters and the sort carried by the url', async () => {
			// Arrange
			const harness = await create(undefined, '/?q=camp&isFavorite=true&sort=-name');

			// Act
			const searched = await (await harness.search()).searchedText();

			// Assert
			expect([searched, calls('inputPageSearchParameters')[0]]).toEqual([
				'camp',
				['camp', undefined, undefined, true, true, '-name'],
			]);
		});

		it('searches the typed text from the first batch and writes it in the url', async () => {
			// Arrange
			const harness = await create(pageOf([]));

			// Act
			await (await harness.search()).search('camp');

			// Assert
			expect([calls('fetchProjectsPage').at(-1), TestBed.inject(Router).url]).toEqual([
				[0, undefined],
				'/?q=camp',
			]);
		});

		it.each([
			{
				name: 'every filter to a user who reads every project and restores one',
				authorities: ALL.concat('p1_REGISTRY_PROJECT_RESTORE'),
				filters: ['is-visible', 'is-favorite', 'with-profile'],
				profile: true,
			},
			{
				name: 'neither the visibility nor the profile filter to the others',
				authorities: ['REGISTRY_PROJECT_C'],
				filters: ['is-favorite'],
				profile: undefined,
			},
		])('offers $name', async ({ authorities: granted, filters, profile }) => {
			// Arrange
			authorities.set(granted);
			const harness = await create(pageOf([]));

			// Act
			const shown = await (await harness.search()).filters();

			// Assert
			expect([shown, calls('inputPageSearchParameters')[0][4]]).toEqual([
				filters.map((filter) => `projects-search-fields-${filter}-select`),
				profile,
			]);
		});

		it.each([
			{ name: 'every applied filter for a user who reads every project', authorities: ALL, expected: '3' },
			{
				name: 'the applied filters but the profile for the others',
				authorities: ['REGISTRY_PROJECT_C'],
				expected: '2',
			},
		])('counts $name', async ({ authorities: granted, expected }) => {
			// Arrange
			authorities.set(granted);
			param('projectsPageQueryParam', 'camp');
			param('projectsPageIsVisibleParam', false);
			param('projectsPageWithProfileParam', true);
			const harness = await create(pageOf([]));

			// Act
			const count = await (await harness.list()).activeFiltersText();

			// Assert
			expect(count?.trim()).toBe(expected);
		});

		it('clears the filters and searches again when the list asks to reset them', async () => {
			// Arrange
			param('projectsPageQueryParam', 'camp');
			const harness = await create(pageOf([]), '/?q=camp');

			// Act
			await (await harness.list()).resetFilters();

			// Assert
			expect([await (await harness.search()).searchedText(), calls('inputPageSearchParameters').at(-1)]).toEqual([
				'',
				[undefined, undefined, undefined, undefined, true, undefined],
			]);
		});

		it('refreshes the shown batches silently when the refresh service asks', async () => {
			// Arrange
			await create(pageOf([]));

			// Act
			reloads.forEach((reload) => reload());

			// Assert
			expect(calls('refreshProjectsPage')).toHaveLength(1);
		});

		it('asks for the next batch when the list asks for it', async () => {
			// Arrange
			const harness = await create(pageOf([project()], true));

			// Act
			await (await (await harness.list()).loadMore())?.loadMore();

			// Assert
			expect(calls('fetchProjectsPage').at(-1)).toEqual([1, 20]);
		});
	});

	describe('rows', () => {
		it.each([
			{
				name: 'a visible project with dates',
				overrides: { name: '  vercors 2026', end: { date: '2026-02-01' } as ProjectModel['end'] },
				expected: {
					name: 'vercors 2026',
					initials: 'V2',
					period: 'datedate',
					disabled: false,
				},
			},
			{
				name: 'a hidden permanent project',
				overrides: { visible: false, begin: undefined, end: undefined },
				expected: { name: 'Camp', initials: 'CA', period: 'projects.list.permanent', disabled: true },
			},
		])('shows $name', async ({ overrides, expected }) => {
			// Arrange
			const harness = await create(pageOf([project(overrides)]));

			// Act
			const [row] = await harness.rows();

			// Assert
			expect(row).toEqual(expected);
		});

		it('toggles the favorite of a project', async () => {
			// Arrange
			const shown = project();
			const harness = await create(pageOf([shown]));

			// Act
			await (await harness.favorite('p1')).toggle();

			// Assert
			expect(calls('toggleFavorite')).toEqual([[shown]]);
		});

		it('lists the options of a project in a dialog, closed when it hides itself', async () => {
			// Arrange
			const options = [
				{ label: 'Vehicle', value: ProjectOptionEnum.VEHICLE },
				{ label: 'Alert', value: ProjectOptionEnum.ALERT },
			];
			const harness = await create(pageOf([project({ options })]));
			await (await harness.status('p1')).openOptions();
			const opened = await harness.optionsShown();

			// Act
			await harness.hideDialog(ProjectsListDialogEnum.OPTIONS);

			// Assert
			expect([opened, (await harness.optionsShown()).options]).toEqual([
				{ open: true, options: ['Vehicle', 'Alert'] },
				[],
			]);
		});

		it('keeps the options dialog open when an element inside it hides its own panel', async () => {
			// Arrange
			const harness = await create(
				pageOf([
					project({
						options: [
							{ label: 'Vehicle', value: ProjectOptionEnum.VEHICLE },
							{ label: 'Alert', value: ProjectOptionEnum.ALERT },
						],
					}),
				]),
			);
			await (await harness.status('p1')).openOptions();
			const item = document.querySelector('[data-test-id="projects-list-option-item"]');

			// Act
			item?.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

			// Assert
			expect((await harness.optionsShown()).options).toEqual(['Vehicle', 'Alert']);
		});

		it('tells that a hidden project cannot be opened, until the notice is closed', async () => {
			// Arrange
			const harness = await create(pageOf([project({ visible: false })]));
			await (await harness.status('p1')).select();
			const notice = await harness.hiddenNotice();

			// Act
			await harness.closeHiddenNotice();

			// Assert
			expect([notice.open, notice.message, TestBed.inject(Router).url]).toEqual([
				true,
				'projects.hidden-notice.message',
				'/',
			]);
		});

		it('offers the actions allowed on the project', async () => {
			// Arrange
			authorities.set(ALL.concat('p1_REGISTRY_PROJECT_U'));
			const harness = await create(pageOf([project()]));

			// Act
			const actions = await (await harness.actions('p1')).actions();

			// Assert
			expect(actions.map((action) => [action.id, action.disabled])).toEqual([
				['edit', false],
				['softDelete', true],
				['hardDelete', true],
			]);
		});
	});

	describe('creation', () => {
		it.each([
			{ name: 'offers to create a project to a user allowed to', authorities: ALL, expected: [true, true] },
			{
				name: 'hides the creation from the others',
				authorities: ['REGISTRY_PROJECT_R'],
				expected: [false, false],
			},
		])('$name, also from the welcome of an empty list', async ({ authorities: granted, expected }) => {
			// Arrange
			authorities.set(granted);
			const harness = await create(pageOf([]));

			// Act
			const shown = [await harness.welcomeShown(), await harness.canCreate()];

			// Assert
			expect(shown).toEqual([true, expected]);
		});
	});
});
