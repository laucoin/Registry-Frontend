import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { UserProfileFacade } from '@core/registry/state/user-profile.facade';
import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { ProjectActions } from '@pages/projects/projects-list/project-actions.service';
import { defined } from '@shared/helpers/testing/defined';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ElementActionModel } from '@shared/models/model/element-action.model';
import { ProjectModel } from '@shared/models/model/project.model';

const PROJECT = { id: 'p1', visible: true, name: 'Camp' } as ProjectModel;
const HIDDEN: ProjectModel = { ...PROJECT, visible: false };

describe('ProjectActions', () => {
	let actions: ProjectActions;
	let authorities: WritableSignal<string[]>;
	let facade: Record<string, Mock>;
	let userProfileFacade: { createSupportProjectProfile: Mock };
	let confirm: Mock<(confirmation: { accept: () => void; acceptSeverity: SeverityEnum }) => void>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_U', 'p1_REGISTRY_PROJECT_D']);
		facade = { softDeleteProject: vi.fn(), restoreProject: vi.fn(), hardDeleteProject: vi.fn() };
		userProfileFacade = { createSupportProjectProfile: vi.fn(() => of(undefined)) };
		confirm = vi.fn();
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			providers: [
				ProjectActions,
				{ provide: ProjectFacade, useValue: facade },
				{ provide: UserProfileFacade, useValue: userProfileFacade },
				{ provide: SessionFacade, useValue: { currentUser: (): unknown => ({ authorities: authorities() }) } },
				{ provide: UiFacade, useValue: { confirm } },
				{ provide: Router, useValue: { navigateByUrl } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		actions = TestBed.inject(ProjectActions);
	});

	function find(project: ProjectModel, id: string): ElementActionModel | undefined {
		return actions.actionsFor(project).find((action) => action.id === id);
	}

	it('offers edit, disable and delete for a visible project', () => {
		// Arrange
		const project = PROJECT;

		// Act
		const ids = actions.actionsFor(project).map((action) => action.id);

		// Assert
		expect(ids).toEqual(['edit', 'softDelete', 'hardDelete']);
	});

	it('offers restore instead of softDelete for a hidden project', () => {
		// Arrange
		const project: ProjectModel = HIDDEN;

		// Act
		const ids = actions.actionsFor(project).map((action) => action.id);

		// Assert
		expect(ids).toEqual(['edit', 'restore', 'hardDelete']);
	});

	it('gates softDelete and restore on their own authorities', () => {
		// Arrange
		const disabled = (element: ProjectModel, id: string): boolean =>
			defined(actions.actionsFor(element).find((it) => it.id === id)).disabled;
		authorities.set(['p1_REGISTRY_PROJECT_U', 'p1_REGISTRY_PROJECT_D']);

		// Act
		const without = [disabled(PROJECT, 'softDelete'), disabled(HIDDEN, 'restore')];
		authorities.set([
			'p1_REGISTRY_PROJECT_U',
			'p1_REGISTRY_PROJECT_D',
			'p1_REGISTRY_PROJECT_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_RESTORE',
		]);
		const withThem = [disabled(PROJECT, 'softDelete'), disabled(HIDDEN, 'restore')];

		// Assert
		expect(without).toEqual([true, true]);
		expect(withThem).toEqual([false, false]);
	});

	it('disables the actions the user has no authority for', () => {
		// Arrange
		authorities.set(['p1_REGISTRY_PROJECT_U']);

		// Act
		const flags = [defined(find(PROJECT, 'edit')).disabled, defined(find(PROJECT, 'hardDelete')).disabled];

		// Assert
		expect(flags).toEqual([false, true]);
	});

	it('opens the edition route of the project', () => {
		// Arrange
		const edit = defined(find(PROJECT, 'edit'));

		// Act
		edit.run();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('p1'));
	});

	it.each([
		['softDelete', 'softDeleteProject', SeverityEnum.WARNING, PROJECT],
		['restore', 'restoreProject', SeverityEnum.INFO, HIDDEN],
		['hardDelete', 'hardDeleteProject', SeverityEnum.DANGER, PROJECT],
	])('asks for a confirmation before running %s, then calls the facade', (id, call, severity, project) => {
		// Arrange
		const action = defined(find(project, id));

		// Act
		action.run();
		const beforeAccept = facade[call].mock.calls.length;
		confirm.mock.calls[0][0].accept();

		// Assert
		expect(beforeAccept).toBe(0);
		expect(confirm.mock.calls[0][0].acceptSeverity).toBe(severity);
		expect(facade[call]).toHaveBeenCalledTimes(1);
		expect(action.danger).toBe(severity === SeverityEnum.DANGER);
	});

	it('lets a user with a project authority join the project', () => {
		// Arrange
		const project = PROJECT;

		// Act
		const result = [actions.canJoin(project), actions.canCreateSupport(project)];

		// Assert
		expect(result).toEqual([true, false]);
	});

	it('offers the support profile to a user without any authority on the project when allowed', () => {
		// Arrange
		authorities.set(['REGISTRY_PROFILE_C']);

		// Act
		const result = [actions.canJoin(PROJECT), actions.canCreateSupport(PROJECT)];

		// Assert
		expect(result).toEqual([false, true]);
	});

	it('does not offer the support profile without the profile creation authority', () => {
		// Arrange
		authorities.set([]);

		// Act
		const canCreateSupport = actions.canCreateSupport(PROJECT);

		// Assert
		expect(canCreateSupport).toBe(false);
	});

	it('opens the project on join', () => {
		// Arrange
		const project = PROJECT;

		// Act
		actions.join(project);

		// Assert
		expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('p1'));
	});

	it('creates the support profile after confirmation, then opens the project', () => {
		// Arrange
		actions.confirmSupportProfile(PROJECT);

		// Act
		confirm.mock.calls[0][0].accept();

		// Assert
		expect(userProfileFacade.createSupportProjectProfile).toHaveBeenCalledWith('p1');
		expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('p1'));
	});
});
