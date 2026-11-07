import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, NavigationEnd, Params, provideRouter, Router } from '@angular/router';

import { filter, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectActions } from '@pages/projects/projects-list/project-actions.service';
import { ProjectsListPage } from '@pages/projects/projects-list/projects-list.page';
import { ProjectsListSearchModel } from '@pages/projects/projects-list/projects-list.search';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { ProjectModel } from '@shared/models/model/project.model';

interface ProjectsListApi {
	canSeeHidden: () => boolean;
	model: WritableSignal<ProjectsListSearchModel>;
	optionsProject: WritableSignal<ProjectModel | undefined>;
	canCreate: () => boolean;
	canFilterByProfile: () => boolean;
	activeFilters: () => number;
	search: () => void;
	resetFilters: () => void;
	loadBatch: (event: { page: number; size: number }) => void;
	initials: (project: ProjectModel) => string;
	isAvailable: (project: ProjectModel) => boolean;
	hiddenProject: WritableSignal<ProjectModel | undefined>;
	closeDialog: (event: Event, shown: WritableSignal<ProjectModel | undefined>) => void;
}

describe('ProjectsListPage', () => {
	let facade: Record<string, Mock>;
	let authorities: WritableSignal<string[]>;

	function create(query: Params = {}): ProjectsListApi {
		facade = autoMock();
		facade['projectsPageQueryParam'].mockReturnValue(undefined);
		facade['projectsPageAtParam'].mockReturnValue(undefined);
		facade['projectsPageIsVisibleParam'].mockReturnValue(undefined);
		facade['projectsPageIsFavoriteParam'].mockReturnValue(undefined);
		facade['projectsPageWithProfileParam'].mockReturnValue(undefined);
		authorities = signal(['REGISTRY_PROJECT_C', 'REGISTRY_PROJECT_R']);
		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				...(Object.keys(query).length > 0
					? [
							{
								provide: ActivatedRoute,
								useValue: {
									snapshot: { queryParamMap: convertToParamMap(query) },
									queryParamMap: of(convertToParamMap(query)),
								},
							},
						]
					: []),
				REFRESH_SERVICE_STUB,
				{ provide: ProjectFacade, useValue: facade },
				{ provide: ProjectActions, useValue: {} },
				{ provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }) } },
			],
		});
		TestBed.overrideComponent(ProjectsListPage, { set: { template: '', imports: [], providers: [] } });
		return TestBed.createComponent(ProjectsListPage).componentInstance as unknown as ProjectsListApi;
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('loads the first batch when it opens', () => {
		// Arrange
		// Act
		create();

		// Assert
		expect(facade['fetchProjectsPage']).toHaveBeenCalledWith(undefined, undefined);
	});

	it('starts from the default filters when the url carries none', () => {
		// Arrange
		const page = create();

		// Act
		const model = page.model();

		// Assert
		expect(model).toEqual({
			q: '',
			at: null,
			isVisible: '',
			isFavorite: '',
			withProfile: 'true',
			sortBy: '',
			sortDirection: 'asc',
		});
	});

	it('starts from the filters carried by the url', () => {
		// Arrange
		// Act
		const page = create({ q: 'camp', isFavorite: 'true' });

		// Assert
		expect(page.model()).toEqual({
			q: 'camp',
			at: null,
			isVisible: '',
			isFavorite: 'true',
			withProfile: 'true',
			sortBy: '',
			sortDirection: 'asc',
		});
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(
			'camp',
			undefined,
			undefined,
			true,
			true,
			undefined,
		);
	});

	it('starts from the sort carried by the url and sends it to the facade', () => {
		// Arrange
		// Act
		const page = create({ sort: '-begin' });

		// Assert
		expect(page.model()).toMatchObject({ sortBy: 'begin', sortDirection: 'desc' });
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(
			undefined,
			undefined,
			undefined,
			undefined,
			true,
			'-begin',
		);
	});

	it('writes the submitted sort in the url', async () => {
		// Arrange
		const page = create();
		const router = TestBed.inject(Router);
		page.model.set({ ...page.model(), sortBy: 'name', sortDirection: 'desc' });
		const navigated: Promise<unknown> = firstValueFrom(
			router.events.pipe(filter((event: unknown) => event instanceof NavigationEnd)),
		);

		// Act
		page.search();
		await navigated;

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith(
			undefined,
			undefined,
			undefined,
			undefined,
			true,
			'-name',
		);
		expect(router.url).toBe('/?sort=-name');
	});

	it('writes the submitted filters in the url', async () => {
		// Arrange
		const page = create();
		const router = TestBed.inject(Router);
		page.model.set({
			q: 'camp',
			at: null,
			isVisible: '',
			isFavorite: 'true',
			withProfile: 'true',
			sortBy: '',
			sortDirection: 'asc',
		});

		const navigated: Promise<unknown> = firstValueFrom(
			router.events.pipe(filter((event: unknown) => event instanceof NavigationEnd)),
		);

		// Act
		page.search();
		await navigated;

		// Assert
		expect(router.url).toBe('/?q=camp&isFavorite=true');
	});

	it('sends the typed filters to the facade and restarts from the first batch', () => {
		// Arrange
		const page = create();
		const when = new Date(2026, 9, 3);
		page.model.set({
			q: 'camp',
			at: when,
			isVisible: 'false',
			isFavorite: 'true',
			withProfile: '',
			sortBy: '',
			sortDirection: 'asc',
		});

		// Act
		page.search();

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(
			'camp',
			when,
			false,
			true,
			undefined,
			undefined,
		);
		expect(facade['fetchProjectsPage']).toHaveBeenLastCalledWith(0, undefined);
	});

	it('clears the filters when they are reset, then searches again', () => {
		// Arrange
		const page = create();
		page.model.set({
			q: 'camp',
			at: new Date(),
			isVisible: 'true',
			isFavorite: 'false',
			withProfile: '',
			sortBy: '',
			sortDirection: 'asc',
		});

		// Act
		page.resetFilters();

		// Assert
		expect(page.model()).toEqual({
			q: '',
			at: null,
			isVisible: '',
			isFavorite: '',
			withProfile: 'true',
			sortBy: '',
			sortDirection: 'asc',
		});
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(
			undefined,
			undefined,
			undefined,
			undefined,
			true,
			undefined,
		);
	});

	it('toggles the favorite of a project through the facade', () => {
		// Arrange
		const page = create();
		const project = { id: 'p1', favorite: false } as ProjectModel;

		// Act
		(page as unknown as { toggleFavorite: (project: ProjectModel) => void }).toggleFavorite(project);

		// Assert
		expect(facade['toggleFavorite']).toHaveBeenCalledWith(project);
	});

	it('asks the facade for the requested batch without touching the search parameters', () => {
		// Arrange
		const page = create();

		facade['inputPageSearchParameters'].mockClear();

		// Act
		page.loadBatch({ page: 2, size: 20 });

		// Assert
		expect(facade['fetchProjectsPage']).toHaveBeenLastCalledWith(2, 20);
		expect(facade['inputPageSearchParameters']).not.toHaveBeenCalled();
	});

	it('counts the filters applied by the facade, leaving out the profile switch', () => {
		// Arrange
		const page = create();
		facade['projectsPageQueryParam'].mockReturnValue('camp');
		facade['projectsPageIsVisibleParam'].mockReturnValue(false);

		// Act
		const count = page.activeFilters();

		// Assert
		expect(count).toBe(2);
	});

	it('sends the profile filter when the user has the global read authority', () => {
		// Arrange
		const page = create();
		page.model.set({
			q: '',
			at: null,
			isVisible: '',
			isFavorite: '',
			withProfile: 'true',
			sortBy: '',
			sortDirection: 'asc',
		});

		// Act
		page.search();

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(
			undefined,
			undefined,
			undefined,
			undefined,
			true,
			undefined,
		);
	});

	it('never sends the profile filter without the global read authority', () => {
		// Arrange
		const page = create();
		authorities.set(['REGISTRY_PROJECT_C']);
		page.model.set({
			q: '',
			at: null,
			isVisible: '',
			isFavorite: '',
			withProfile: 'true',
			sortBy: '',
			sortDirection: 'asc',
		});

		// Act
		page.search();

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith(
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
		);
	});

	it('offers the visibility filter only to users who can restore a project', () => {
		// Arrange
		const page = create();
		authorities.set(['p1_REGISTRY_PROJECT_U', 'p1_REGISTRY_PROJECT_D']);
		const withoutRestore = page.canSeeHidden();

		// Act
		authorities.set(['p1_REGISTRY_PROJECT_RESTORE']);

		// Assert
		expect(withoutRestore).toBe(false);
		expect(page.canSeeHidden()).toBe(true);
	});

	it('reads the creation right from the session', () => {
		// Arrange
		const page = create();
		authorities.set(['REGISTRY_PROJECT_R']);

		// Act
		const rights = [page.canCreate()];

		// Assert
		expect(rights).toEqual([false]);
	});

	it.each([
		['  vercors 2026', 'V2'],
		["Camp d'été Vercors", 'CD'],
		['Rallye', 'RA'],
		['🔥 feu de camp', '🔥F'],
		['🔥🔥🔥', '🔥🔥'],
	])('builds the avatar initials of "%s"', (name, expected) => {
		// Arrange
		const page = create();

		// Act
		const initials = page.initials({ name } as ProjectModel);

		// Assert
		expect(initials).toBe(expected);
	});

	it('tells whether a project is available from its status', () => {
		// Arrange
		const page = create();

		// Act
		const results = [
			page.isAvailable({ status: { value: AvailabilityStatusEnum.AVAILABLE } } as ProjectModel),
			page.isAvailable({ status: undefined } as ProjectModel),
		];

		// Assert
		expect(results).toEqual([true, false]);
	});

	it('closes a dialog only when the dialog itself is hidden', () => {
		// Arrange
		const page = create();
		const dialog = new EventTarget();
		const nested = new EventTarget();
		page.optionsProject.set({ id: 'p1' } as ProjectModel);

		// Act
		page.closeDialog({ target: nested, currentTarget: dialog } as unknown as Event, page.optionsProject);
		const afterNested = page.optionsProject();
		page.closeDialog({ target: dialog, currentTarget: dialog } as unknown as Event, page.optionsProject);

		// Assert
		expect(afterNested).toBeDefined();
		expect(page.optionsProject()).toBeUndefined();
	});
});
