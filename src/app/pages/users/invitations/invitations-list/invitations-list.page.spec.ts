import { WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, NavigationEnd, Params, provideRouter, Router } from '@angular/router';

import { filter, firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock } from 'vitest';

import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { InvitationsListPage } from '@pages/users/invitations/invitations-list/invitations-list.page';
import { InvitationsListSearchModel } from '@pages/users/invitations/invitations-list/invitations-list.search';
import { autoMock } from '@shared/helpers/testing/auto-mock';

interface InvitationsListApi {
	model: WritableSignal<InvitationsListSearchModel>;
	search: () => void;
	resetFilters: () => void;
}

describe('InvitationsListPage', () => {
	let facade: Record<string, Mock>;

	function create(query: Params = {}): InvitationsListApi {
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
				{ provide: UserProfileFacade, useValue: facade },
			],
		});
		TestBed.overrideComponent(InvitationsListPage, { set: { template: '', imports: [] } });
		return TestBed.createComponent(InvitationsListPage).componentInstance as unknown as InvitationsListApi;
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('starts from the default filters when the url carries none', () => {
		// Arrange
		// Act
		const page = create();

		// Assert
		expect(page.model()).toEqual({ q: '', at: null, sortBy: '', sortDirection: 'asc' });
		expect(facade['fetchProjectProfileInvitationPage']).toHaveBeenCalledWith(undefined, undefined);
	});

	it('starts from the filters carried by the url', () => {
		// Arrange
		// Act
		const page = create({ q: 'camp', at: '2026-01-02T00:00:00.000Z' });

		// Assert
		expect(page.model()).toEqual({
			q: 'camp',
			at: new Date('2026-01-02T00:00:00.000Z'),
			sortBy: '',
			sortDirection: 'asc',
		});
		expect(facade['inputInvitationsPageSearchParameters']).toHaveBeenCalledWith(
			'camp',
			new Date('2026-01-02T00:00:00.000Z'),
			undefined,
		);
	});

	it('sends the typed filters to the facade, restarts from the first batch and writes the url', async () => {
		// Arrange
		const page = create();
		const router = TestBed.inject(Router);
		page.model.set({ q: 'camp', at: null, sortBy: '', sortDirection: 'asc' });

		const navigated: Promise<unknown> = firstValueFrom(
			router.events.pipe(filter((event: unknown) => event instanceof NavigationEnd)),
		);

		// Act
		page.search();
		await navigated;

		// Assert
		expect(facade['inputInvitationsPageSearchParameters']).toHaveBeenLastCalledWith('camp', undefined, undefined);
		expect(facade['fetchProjectProfileInvitationPage']).toHaveBeenLastCalledWith(0, undefined);
		expect(router.url).toBe('/?q=camp');
	});

	it('clears the filters when they are reset, then searches again', () => {
		// Arrange
		const page = create();
		page.model.set({ q: 'camp', at: new Date(), sortBy: '', sortDirection: 'asc' });

		// Act
		page.resetFilters();

		// Assert
		expect(page.model()).toEqual({ q: '', at: null, sortBy: '', sortDirection: 'asc' });
		expect(facade['inputInvitationsPageSearchParameters']).toHaveBeenLastCalledWith(
			undefined,
			undefined,
			undefined,
		);
	});
});
