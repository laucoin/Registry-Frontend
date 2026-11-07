import { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, NavigationEnd, Params, provideRouter, Router } from '@angular/router';

import { filter, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantsListPage } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.page';
import { ParticipantsListSearchModel } from '@pages/projects/[projectId]/configuration/participants/participants-list/participants-list.search';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';

interface ParticipantsListApi {
	model: WritableSignal<ParticipantsListSearchModel>;
	search: () => void;
	resetFilters: () => void;
}

describe('ParticipantsListPage', () => {
	let facade: Record<string, Mock>;

	function create(query: Params = {}): ParticipantsListApi {
		facade = autoMock();
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
				{ provide: ParticipantFacade, useValue: facade },
				{ provide: SessionFacade, useValue: autoMock() },
			],
		});
		TestBed.overrideComponent(ParticipantsListPage, { set: { template: '', imports: [], providers: [] } });
		return TestBed.createComponent(ParticipantsListPage).componentInstance as unknown as ParticipantsListApi;
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('starts from the default filters when the url carries none', () => {
		// Arrange
		// Act
		const page = create();

		// Assert
		expect(page.model()).toEqual({ q: '', status: '', isVisible: '', sortBy: '', sortDirection: 'asc' });
		expect(facade['fetchParticipantsPage']).toHaveBeenCalledWith(undefined, undefined);
	});

	it('starts from the filters carried by the url', () => {
		// Arrange
		// Act
		const page = create({ q: 'ada', status: 'ACTIVE', isVisible: 'false' });

		// Assert
		expect(page.model()).toEqual({
			q: 'ada',
			status: 'ACTIVE',
			isVisible: 'false',
			sortBy: '',
			sortDirection: 'asc',
		});
		expect(facade['inputPageSearchParameters']).toHaveBeenCalledWith('ada', 'ACTIVE', false, undefined);
	});

	it('sends the typed filters to the facade, restarts from the first batch and writes the url', async () => {
		// Arrange
		const page = create();
		const router = TestBed.inject(Router);
		page.model.set({ q: 'camp', status: '', isVisible: '', sortBy: '', sortDirection: 'asc' });

		const navigated: Promise<unknown> = firstValueFrom(
			router.events.pipe(filter((event: unknown) => event instanceof NavigationEnd)),
		);

		// Act
		page.search();
		await navigated;

		// Assert
		expect(facade['inputPageSearchParameters']).toHaveBeenLastCalledWith('camp', undefined, undefined, undefined);
		expect(facade['fetchParticipantsPage']).toHaveBeenLastCalledWith(0, undefined);
		expect(router.url).toBe('/?q=camp');
	});

	it('clears the filters when they are reset, then searches again', () => {
		// Arrange
		const page = create({ q: 'ada', status: 'ACTIVE', isVisible: 'false' });

		// Act
		page.resetFilters();

		// Assert
		expect(page.model()).toEqual({ q: '', status: '', isVisible: '', sortBy: '', sortDirection: 'asc' });
		expect(facade['fetchParticipantsPage']).toHaveBeenLastCalledWith(0, undefined);
	});
});
