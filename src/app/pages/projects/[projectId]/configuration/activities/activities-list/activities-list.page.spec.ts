import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ActivitiesListPage } from '@pages/projects/[projectId]/configuration/activities/activities-list/activities-list.page';
import { ActivitiesListHarness } from '@pages/projects/[projectId]/configuration/activities/activities-list/testing/activities-list.harness';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { ActivityModel } from '@shared/models/model/activity.model';
import { PageModel } from '@shared/models/model/page.model';

@Component({ template: '' })
class EmptyComponent {}

const CHOICES = [
	{ label: '-', value: undefined },
	{ label: 'Yes', value: true },
	{ label: 'No', value: false },
];

const pageOf = (ids: string[], hasNext = false): PageModel<ActivityModel> => ({
	content: ids.map((id) => ({ id, name: id, visible: true }) as unknown as ActivityModel),
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : ids.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

describe('ActivitiesListPage', () => {
	let facade: Record<string, Mock>;
	let authorities: WritableSignal<string[]>;

	const calls = (name: string): unknown[][] => facade[name].mock.calls;
	const param = (name: string, value: unknown): void =>
		(facade[name] as unknown as WritableSignal<unknown>).set(value);

	async function create(page: PageModel<ActivityModel> | undefined, url = '/'): Promise<ActivitiesListHarness> {
		param('activitiesPage', page);
		await TestBed.inject(Router).navigateByUrl(url);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ActivitiesListPage),
			ActivitiesListHarness,
		);
	}

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_ACTIVITY_C']);
		facade = Object.assign(autoMock(undefined), {
			activitiesPage: signal(undefined),
			activitiesPageError: signal(undefined),
			activitiesPageLoading: signal(false),
			activitiesPageSilentLoading: signal(false),
			activitiesPageQueryParam: signal(undefined),
			activitiesPageAtParam: signal(undefined),
			activitiesPageIsAvailableParam: signal(undefined),
			activitiesPageIsVisibleParam: signal(undefined),
			availabilitiesMetadata: signal(CHOICES),
			visibilitiesMetadata: signal(CHOICES),
			fetchActivitiesPage: vi.fn(),
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
				{ provide: ActivityFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: authorities() }),
						selectedProject: signal({ id: 'p1' }),
						currentProjectId: signal('p1'),
					},
				},
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
		expect([title, calls('inputPageSearchParameters'), calls('fetchActivitiesPage')]).toEqual([
			'activities.list.title',
			[[undefined, undefined, undefined, undefined, undefined]],
			[[undefined, undefined]],
		]);
	});

	it('starts from the text and the sort carried by the url', async () => {
		// Arrange
		const harness = await create(undefined, '/?q=hike&sort=-name');

		// Act
		const searched = await (await harness.search()).searchedText();

		// Assert
		expect([searched, calls('inputPageSearchParameters')[0]]).toEqual([
			'hike',
			['hike', undefined, undefined, undefined, '-name'],
		]);
	});

	it('searches the typed text from the first batch and writes it in the url', async () => {
		// Arrange
		const harness = await create(pageOf([]));

		// Act
		await (await harness.search()).search('hike');

		// Assert
		expect([calls('fetchActivitiesPage').at(-1), TestBed.inject(Router).url]).toEqual([[0, undefined], '/?q=hike']);
	});

	it('counts every applied filter', async () => {
		// Arrange
		param('activitiesPageQueryParam', 'hike');
		param('activitiesPageAtParam', new Date());
		param('activitiesPageIsAvailableParam', true);
		param('activitiesPageIsVisibleParam', false);
		const harness = await create(pageOf([]));

		// Act
		const count = await (await harness.list()).activeFiltersText();

		// Assert
		expect(count?.trim()).toBe('4');
	});

	it('clears the filters and searches again when the list asks to reset them', async () => {
		// Arrange
		param('activitiesPageQueryParam', 'hike');
		const harness = await create(pageOf([]), '/?q=hike');

		// Act
		await (await harness.list()).resetFilters();

		// Assert
		expect([await (await harness.search()).searchedText(), calls('fetchActivitiesPage').at(-1)]).toEqual([
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
		expect([await harness.rows(), calls('fetchActivitiesPage').at(-1)]).toEqual([
			['e1', 'e2'],
			[1, 20],
		]);
	});

	it.each([
		{
			name: 'offers the creation to a user who creates them',
			granted: ['p1_REGISTRY_PROJECT_ACTIVITY_C'],
			shown: true,
		},
		{ name: 'hides the creation from the others', granted: [], shown: false },
	])('$name', async ({ granted, shown }) => {
		// Arrange
		authorities.set(granted);
		const harness = await create(pageOf([]));

		// Act
		const offered = await harness.canCreate();

		// Assert
		expect(offered).toBe(shown);
	});

	it('opens the creation form and keeps the search', async () => {
		// Arrange
		const harness = await create(pageOf([]), '/?q=hike');

		// Act
		await harness.create();

		// Assert
		expect(TestBed.inject(Router).url).toBe('/create?q=hike');
	});
});
