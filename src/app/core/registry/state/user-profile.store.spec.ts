import { TestBed } from '@angular/core/testing';

import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { UserProfileStore } from '@core/registry/state/user-profile.store';
import { UserProjectProfileApi } from '@core/registry/state/user-project-profile.api';
import { defined } from '@shared/helpers/testing/defined';
import { backendError } from '@shared/helpers/testing/test-fixtures';
import { PageModel } from '@shared/models/model/page.model';
import { UserInvitationModel } from '@shared/models/model/user-invitation.model';

const PAGE: PageModel<UserInvitationModel> = {
	page: 0,
	size: 10,
	totalElements: 1,
	totalPages: 1,
	hasNext: false,
	content: [{ id: 'pp1' } as UserInvitationModel],
	lastRefresh: new Date(),
};

describe('UserProfileStore', () => {
	let store: InstanceType<typeof UserProfileStore>;
	let findUserProjectProfiles: Mock<UserProjectProfileApi['findUserProjectProfiles']>;

	beforeEach(() => {
		findUserProjectProfiles = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				{ provide: UserProjectProfileApi, useValue: { findUserProjectProfiles } },
				{ provide: ErrorReporter, useValue: { notify: vi.fn() } },
			],
		});
		store = TestBed.inject(UserProfileStore);
	});

	it('stores the fetched invitations page', () => {
		// Arrange
		findUserProjectProfiles.mockReturnValue(of(PAGE));

		// Act
		store.fetchInvitationsPage({ page: 0, size: 10 });

		// Assert
		expect(store.invitations.element()).toEqual(PAGE);
		expect(store.invitations.loading()).toBe(false);
	});

	it('reloads the invitations already shown without raising the loader', () => {
		// Arrange
		findUserProjectProfiles.mockReturnValue(of(PAGE));

		// Act
		store.refreshInvitationsPage({ page: 0, size: 10 });

		// Assert
		expect(store.invitations.element()).toEqual(PAGE);
		expect(store.invitations.loading()).toBe(false);
	});

	it('appends the next batch to the invitations already shown', () => {
		// Arrange
		const first: PageModel<UserInvitationModel> = { ...PAGE, size: 1, totalPages: 2 };
		const second: PageModel<UserInvitationModel> = {
			...first,
			page: 1,
			content: [{ id: 'pp2' } as UserInvitationModel],
		};
		findUserProjectProfiles.mockReturnValueOnce(of(first)).mockReturnValueOnce(of(second));
		store.fetchInvitationsPage({ page: 0, size: 1 });

		// Act
		store.fetchInvitationsPage({ page: 1, size: 1 });

		// Assert
		const ids = defined(store.invitations.element()).content.map((profile) => profile.id);
		expect(ids).toEqual(['pp1', 'pp2']);
	});

	it('updates the favorite of the project in every shown invitation', () => {
		// Arrange
		const page: PageModel<UserInvitationModel> = {
			...PAGE,
			content: [
				{ id: 'pp1', project: { id: 'p1', name: 'Camp', favorite: false } } as UserInvitationModel,
				{ id: 'pp2', project: { id: 'p1', name: 'Camp', favorite: false } } as UserInvitationModel,
				{ id: 'pp3', project: { id: 'p2', name: 'Other', favorite: false } } as UserInvitationModel,
			],
		};
		findUserProjectProfiles.mockReturnValue(of(page));
		store.fetchInvitationsPage({ page: 0, size: 10 });

		// Act
		store.setProjectFavorite('p1', true);

		// Assert
		const favorites = store.invitations.element()?.content.map((profile) => profile.project?.favorite);
		expect(favorites).toEqual([true, true, false]);
	});

	it('leaves the page untouched when none is shown', () => {
		// Arrange
		const projectId = 'p1';

		// Act
		store.setProjectFavorite(projectId, true);

		// Assert
		expect(store.invitations.element()).toBeUndefined();
	});

	it('keeps the error of a failed invitations fetch', () => {
		// Arrange
		findUserProjectProfiles.mockReturnValue(throwError(() => backendError(500, 'Title', 'Message')));

		// Act
		store.fetchInvitationsPage({ page: 0, size: 10 });

		// Assert
		expect(store.invitations.error()?.summary).toBe('Title');
	});

	it('keeps a 503 failure of the invitations fetch', () => {
		// Arrange
		const error = backendError(503);
		findUserProjectProfiles.mockReturnValue(throwError(() => error));

		// Act
		store.fetchInvitationsPage({ page: 0, size: 10 });

		// Assert
		expect(store.invitations.error()).toBeDefined();
	});

	it('merges the search parameters of the invitations page', () => {
		// Arrange
		const params = { q: 'wolves', resetSearch: true };

		// Act
		store.updateInvitationsPageSearchParams(params);

		// Assert
		expect(store.invitations.params.q()).toBe('wolves');
		expect(store.invitations.params.status()).toBeDefined();
	});

	it('forgets the loaded invitations on reset', () => {
		// Arrange
		findUserProjectProfiles.mockReturnValue(of(PAGE));
		store.fetchInvitationsPage({ page: 0, size: 10 });

		// Act
		store.reset();

		// Assert
		expect(store.invitations.element()).toBeUndefined();
	});
});
