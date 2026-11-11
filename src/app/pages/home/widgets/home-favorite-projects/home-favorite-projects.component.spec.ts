import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { HomeFacade } from '@pages/home/data/state/home.facade';
import { HomeFavoriteProjectsComponent } from '@pages/home/widgets/home-favorite-projects/home-favorite-projects.component';
import { HomeFavoriteProjectsHarness } from '@pages/home/widgets/home-favorite-projects/testing/home-favorite-projects.harness';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { ProjectMapper } from '@shared/mappers/project.mapper';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';

@Component({ template: '' })
class EmptyComponent {}

const TRANSLATIONS = {
	home: {
		favorites: {
			title: 'Favorites',
			summary: { one: '{{ count }} favorite', few: '{{ count }} favorites' },
			empty: 'No favorite',
			participants: { one: '{{ count }} participant', few: '{{ count }} participants' },
			vehicles: { one: '{{ count }} vehicle', few: '{{ count }} vehicles' },
			groups: { one: '{{ count }} group', few: '{{ count }} groups' },
			period: '{{ begin }} - {{ end }}',
			permanent: 'Permanent',
			updated: 'updated',
		},
	},
};

const project = (overrides: Partial<ProjectModel> = {}): ProjectModel => ({
	...ProjectMapper.toModel(PROJECT_DTO),
	id: 'p1',
	name: 'Camp des loups',
	counts: undefined,
	begin: undefined,
	end: undefined,
	lastEdition: undefined,
	...overrides,
});

describe('HomeFavoriteProjectsComponent', () => {
	let favorites: WritableSignal<ProjectModel[]>;
	let total: WritableSignal<number | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let fetchFavorites: Mock<() => void>;
	let removeFavorite: Mock<(project: ProjectModel) => void>;
	let refreshFavorites: Mock<() => void>;

	async function create(projects: ProjectModel[] = []): Promise<HomeFavoriteProjectsHarness> {
		favorites.set(projects);
		total.set(projects.length);
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(HomeFavoriteProjectsComponent),
			HomeFavoriteProjectsHarness,
		);
	}

	let reloads: (() => void)[];

	beforeEach(() => {
		reloads = [];
		favorites = signal<ProjectModel[]>([]);
		total = signal<number | undefined>(undefined);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		fetchFavorites = vi.fn();
		removeFavorite = vi.fn();
		refreshFavorites = vi.fn();
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
				{
					provide: HomeFacade,
					useValue: {
						favorites,
						favoritesTotal: total,
						favoritesLoading: loading,
						favoritesError: error,
						fetchFavorites,
						removeFavorite,
						refreshFavorites,
					},
				},
			],
		});
	});

	it('loads the favorites when displayed', async () => {
		// Arrange
		const harness = await create();

		// Act
		const title = await harness.title();

		// Assert
		expect([title, fetchFavorites.mock.calls.length]).toEqual(['Favorites', 1]);
	});

	it('shows the loading state until the first page arrives', async () => {
		// Arrange
		loading.set(true);
		const harness = await TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(HomeFavoriteProjectsComponent),
			HomeFavoriteProjectsHarness,
		);

		// Act
		const shown = [await harness.loadingShown(), await harness.total(), await harness.empty()];

		// Assert
		expect(shown).toEqual([true, undefined, undefined]);
	});

	it('tells that there is no favorite', async () => {
		// Arrange
		const harness = await create([]);

		// Act
		const shown = [await harness.empty(), await harness.total(), (await harness.cards()).length];

		// Assert
		expect(shown).toEqual(['No favorite', '0 favorite', 0]);
	});

	it('shows the section error and retries on demand', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		const harness = await create();

		// Act
		await (await harness.error())?.retry();

		// Assert
		expect(fetchFavorites).toHaveBeenCalledTimes(2);
	});

	it.each([
		{
			name: 'the participants and the vehicles',
			counts: { participants: 142, groups: 7, vehicles: 18 },
			summary: '142 participants · 18 vehicles',
		},
		{
			name: 'the groups without a vehicle count',
			counts: { participants: 1, groups: 7, vehicles: null },
			summary: '1 participant · 7 groups',
		},
		{ name: 'nothing without counts', counts: undefined, summary: undefined },
	])('sums up $name on the card', async ({ counts, summary }) => {
		// Arrange
		const harness = await create([project({ counts: counts as ProjectModel['counts'] })]);

		// Act
		const [card] = await harness.cards();

		// Assert
		expect(card.summary).toBe(summary);
	});

	it.each([
		{
			name: 'once for the days of one month',
			begin: '2026-09-18',
			end: '2026-09-27',
			period: '18 - 27 septembre 2026',
		},
		{
			name: 'the start month when the period crosses months',
			begin: '2026-09-28',
			end: '2026-10-02',
			period: '28 septembre - 2 octobre 2026',
		},
		{
			name: 'both years when the period crosses years',
			begin: '2026-12-28',
			end: '2027-01-02',
			period: '28 décembre 2026 - 2 janvier 2027',
		},
		{ name: 'an open end', begin: '2026-09-18', end: undefined, period: '18 septembre 2026 - ...' },
		{ name: 'an open start', begin: undefined, end: '2026-09-18', period: '... - 18 septembre 2026' },
		{ name: 'a permanent project', begin: undefined, end: undefined, period: 'Permanent' },
	])('writes the period with $name', async ({ begin, end, period }) => {
		// Arrange
		const harness = await create([
			project({
				begin: begin ? ({ date: begin } as ProjectModel['begin']) : undefined,
				end: end ? ({ date: end } as ProjectModel['end']) : undefined,
			}),
		]);

		// Act
		const [card] = await harness.cards();

		// Assert
		expect(card.period).toBe(period);
	});

	it('shows each favorite as a card linked to its project', async () => {
		// Arrange
		const harness = await create([project()]);

		// Act
		const [card] = await harness.cards();

		// Assert
		expect([card.name, card.initials, card.link]).toEqual(['Camp des loups', 'CDL', '/projects/p1']);
	});

	it.each([
		{ name: 'opens the project in the app on a plain click', modifiers: {}, url: '/projects/p1' },
		{ name: 'leaves a modified click to the browser', modifiers: { control: true }, url: '/' },
	])('$name', async ({ modifiers, url }) => {
		// Arrange
		const harness = await create([project()]);

		// Act
		await harness.open(0, modifiers);

		// Assert
		expect(TestBed.inject(Router).url).toBe(url);
	});

	it('ignores a cancelled navigation to the project', async () => {
		// Arrange
		const harness = await create([project()]);
		const navigateByUrl = vi
			.spyOn(TestBed.inject(Router), 'navigateByUrl')
			.mockRejectedValue(new Error('cancelled'));

		// Act
		await harness.open(0);

		// Assert
		expect([navigateByUrl.mock.calls, TestBed.inject(Router).url]).toEqual([[['/projects/p1']], '/']);
	});

	it('removes a project from the favorites', async () => {
		// Arrange
		const favorite = project();
		const harness = await create([favorite]);

		// Act
		await harness.remove(0);

		// Assert
		expect(removeFavorite).toHaveBeenCalledWith(favorite);
	});

	it('refreshes silently when the refresh service asks', async () => {
		// Arrange
		await create();

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect(refreshFavorites).toHaveBeenCalledTimes(1);
	});
});
