import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';

import { ProjectApi } from '@core/registry/state/project.api';
import { UiFacade } from '@core/registry/state/ui.facade';
import { HomeStore } from '@pages/home/data/state/home.store';
import { PROJECT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ProjectMapper } from '@shared/mappers/project.mapper';
import { ProjectModel } from '@shared/models/model/project.model';

import { HomeFacade } from './home.facade';

function project(id: string, activeAlerts: number | undefined | null): ProjectModel {
	if (activeAlerts === null) return { ...ProjectMapper.toModel(PROJECT_DTO), id, counts: undefined };
	return {
		...ProjectMapper.toModel(PROJECT_DTO),
		id,
		counts: {
			participants: 1,
			groups: 1,
			acceptedProfiles: 1,
			vehicles: undefined,
			activities: undefined,
			activeAlerts,
		},
	};
}

describe('HomeFacade', () => {
	let facade: HomeFacade;
	let fetchFavorites: ReturnType<typeof vi.fn>;
	let fetchAttention: ReturnType<typeof vi.fn>;
	let setFavoriteById: ReturnType<typeof vi.fn>;
	let favoritesPage: WritableSignal<{ content: ProjectModel[]; totalElements: number } | undefined>;
	let attentionPage: WritableSignal<{ content: ProjectModel[]; totalElements: number } | undefined>;

	beforeEach(() => {
		fetchFavorites = vi.fn();
		fetchAttention = vi.fn();
		setFavoriteById = vi.fn().mockReturnValue(of(undefined));
		const page = (content: ProjectModel[]): { content: ProjectModel[]; totalElements: number } => ({
			content,
			totalElements: content.length,
		});
		favoritesPage = signal(page([project('a', 0)]));
		attentionPage = signal(page([project('b', 3), project('c', 0), project('d', undefined), project('e', null)]));
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				HomeFacade,
				{
					provide: HomeStore,
					useValue: {
						favorites: { element: favoritesPage, loading: signal(false), error: signal(undefined) },
						attention: { element: attentionPage, loading: signal(false), error: signal(undefined) },
						fetchFavorites,
						fetchAttention,
					},
				},
				{ provide: ProjectApi, useValue: { setFavoriteById } },
				{ provide: UiFacade, useValue: { notify: vi.fn() } },
			],
		});
		facade = TestBed.inject(HomeFacade);
	});

	it('should keep only the projects with an active alert in the attention list', () => {
		// Arrange

		// Act
		const ids = facade.attention().map((item) => item.id);

		// Assert
		expect(ids).toEqual(['b']);
	});

	it('should request a small first page of favorites and of alerted projects', () => {
		// Arrange

		// Act
		facade.fetchFavorites();
		facade.fetchAttention();

		// Assert
		expect(fetchFavorites).toHaveBeenCalledWith({ page: 0, size: 3 });
		expect(fetchAttention).toHaveBeenCalledWith({ page: 0, size: 5 });
	});

	it('should remove a favorite then reload the favorites', () => {
		// Arrange
		const favorite = project('a', 0);

		// Act
		facade.removeFavorite(favorite);

		// Assert
		expect(setFavoriteById).toHaveBeenCalledWith('a', false);
		expect(fetchFavorites).toHaveBeenCalledTimes(1);
	});

	it('should refresh silently the first page of favorites and of alerted projects', () => {
		// Arrange
		const refreshFavorites: ReturnType<typeof vi.fn> = vi.fn();
		const refreshAttention: ReturnType<typeof vi.fn> = vi.fn();
		Object.assign(TestBed.inject(HomeStore), { refreshFavorites, refreshAttention });

		// Act
		facade.refreshFavorites();
		facade.refreshAttention();

		// Assert
		expect(refreshFavorites).toHaveBeenCalledWith({ page: 0, size: 3 });
		expect(refreshAttention).toHaveBeenCalledWith({ page: 0, size: 5 });
	});

	it('should expose the number of favorites', () => {
		// Arrange

		// Act
		const total = facade.favoritesTotal();

		// Assert
		expect(total).toBe(1);
		expect(facade.favorites()).toHaveLength(1);
	});

	it('should expose empty lists and no total before the first pages arrive', () => {
		// Arrange
		favoritesPage.set(undefined);
		attentionPage.set(undefined);

		// Act
		const shown = [facade.favorites(), facade.favoritesTotal(), facade.attention()];

		// Assert
		expect(shown).toEqual([[], undefined, []]);
	});
});
