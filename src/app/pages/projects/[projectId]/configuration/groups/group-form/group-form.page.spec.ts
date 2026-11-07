import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { GroupFormModel } from '@pages/projects/[projectId]/configuration/groups/group-form/group.form';
import { GroupFormPage } from '@pages/projects/[projectId]/configuration/groups/group-form/group-form.page';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { GROUP_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';

interface PageApi {
	submit: () => void;
	model: { (): GroupFormModel; set: (value: GroupFormModel) => void };
	error: () => unknown;
	activeTab: () => number;
	createdGroupId: () => string | undefined;
	addMembersModel: { set: (value: { participants: { id: string }[] }) => void };
	addMembers: () => void;
	skip: () => void;
}

const FILLED: GroupFormModel = { name: 'Wolves', beginDateTime: null, endDateTime: null };

describe('GroupFormPage', () => {
	let facade: Record<string, Mock>;
	let back: Mock<() => void>;

	function create(id: string | undefined): PageApi {
		facade = autoMock();
		back = vi.fn();
		facade['fetchGroup'].mockReturnValue(of(GROUP_DTO));
		facade['updateGroup'].mockReturnValue(of(GROUP_DTO));
		facade['createGroup'].mockReturnValue(of(GROUP_DTO));
		facade['addMembersToGroup'].mockReturnValue(of({ members: ['pa1'], notAddedMemberIds: [] }));
		RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel;
		RegistryConfig.environment = {
			production: false,
			backend: { url: 'http://backend.test', noAuthPaths: [] },
			hosting: { providerName: null, providerAddress: null },
		};
		TestBed.configureTestingModule({
			providers: [
				{ provide: GroupFacade, useValue: facade },
				{ provide: Location, useValue: { back } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: id ? { groupId: id } : {} } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: (): undefined => undefined },
				},
				{ provide: UiFacade, useValue: autoMock() },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		TestBed.overrideComponent(GroupFormPage, { set: { template: '', imports: [], providers: [] } });
		return TestBed.createComponent(GroupFormPage).componentInstance as unknown as PageApi;
	}

	beforeEach(() => {
		TestBed.resetTestingModule();
	});

	it('does not save an empty form', () => {
		// Arrange
		const page = create(undefined);

		// Act
		page.submit();

		// Assert
		expect(facade['createGroup']).not.toHaveBeenCalled();
		expect(facade['updateGroup']).not.toHaveBeenCalled();
	});

	it('loads the group to edit and fills the form with it', () => {
		// Arrange
		const id = 'g1';

		// Act
		const page = create(id);

		// Assert
		expect(facade['fetchGroup']).toHaveBeenCalledWith(id);
		expect(page.model().name).toEqual(GROUP_DTO.name);
	});

	it('updates the group with its id and the form values, then goes back', () => {
		// Arrange
		const page = create('g1');

		// Act
		page.submit();

		// Assert
		expect(facade['updateGroup']).toHaveBeenCalledWith(
			'g1',
			expect.objectContaining({ name: GROUP_DTO.name }),
			WHEN_ETAG,
		);
		expect(facade['createGroup']).not.toHaveBeenCalled();
		expect(back).toHaveBeenCalledTimes(1);
	});

	it('creates a group from the filled form', () => {
		// Arrange
		const page = create(undefined);
		page.model.set(FILLED);

		// Act
		page.submit();

		// Assert
		expect(facade['createGroup']).toHaveBeenCalledWith(expect.objectContaining({ name: 'Wolves' }));
		expect(facade['updateGroup']).not.toHaveBeenCalled();
	});

	it('moves to the members step after the creation, without leaving the page', () => {
		// Arrange
		const page = create(undefined);
		page.model.set(FILLED);

		// Act
		page.submit();

		// Assert
		expect([page.activeTab(), page.createdGroupId()]).toEqual([2, GROUP_DTO.id]);
		expect(back).not.toHaveBeenCalled();
	});

	it('adds the chosen members to the created group, then goes back', () => {
		// Arrange
		const page = create(undefined);
		page.model.set(FILLED);
		page.submit();
		page.addMembersModel.set({ participants: [{ id: 'pa1' }] });

		// Act
		page.addMembers();

		// Assert
		expect(facade['addMembersToGroup']).toHaveBeenCalledWith(GROUP_DTO.id, ['pa1']);
		expect(back).toHaveBeenCalledTimes(1);
	});

	it('does not add members when none is chosen', () => {
		// Arrange
		const page = create(undefined);
		page.model.set(FILLED);
		page.submit();

		// Act
		page.addMembers();

		// Assert
		expect(facade['addMembersToGroup']).not.toHaveBeenCalled();
		expect(back).not.toHaveBeenCalled();
	});

	it('stays on the members step when adding members fails', () => {
		// Arrange
		const page = create(undefined);
		facade['addMembersToGroup'].mockReturnValue(throwError((): object => ({ title: 'T' })));
		page.model.set(FILLED);
		page.submit();
		page.addMembersModel.set({ participants: [{ id: 'pa1' }] });

		// Act
		page.addMembers();

		// Assert
		expect([back.mock.calls.length, page.error()]).toEqual([0, { title: 'T' }]);
	});

	it('skips the members step by going back', () => {
		// Arrange
		const page = create(undefined);

		// Act
		page.skip();

		// Assert
		expect(back).toHaveBeenCalledTimes(1);
		expect(facade['addMembersToGroup']).not.toHaveBeenCalled();
	});

	it('shows the error of a failed save and stays on the page', () => {
		// Arrange
		const page = create(undefined);
		facade['createGroup'].mockReturnValue(throwError((): object => ({ title: 'T' })));
		page.model.set(FILLED);

		// Act
		page.submit();

		// Assert
		expect(back).not.toHaveBeenCalled();
		expect(page.error()).toEqual({ title: 'T' });
	});
});
