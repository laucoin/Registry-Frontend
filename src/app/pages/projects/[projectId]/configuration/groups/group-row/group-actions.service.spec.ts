import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { GroupActions } from '@pages/projects/[projectId]/configuration/groups/group-row/group-actions.service';
import { defined } from '@shared/helpers/testing/defined';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ElementActionModel } from '@shared/models/model/element-action.model';
import { GroupModel } from '@shared/models/model/group.model';

const VISIBLE = { id: 'x1', visible: true } as GroupModel;
const HIDDEN: GroupModel = { ...VISIBLE, visible: false };

describe('GroupActions', () => {
	let actions: GroupActions;
	let authorities: WritableSignal<string[]>;
	let facade: Record<string, Mock>;
	let confirm: Mock<(confirmation: { accept: () => void; acceptSeverity: SeverityEnum }) => void>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	beforeEach(() => {
		authorities = signal([
			'p1_REGISTRY_PROJECT_GROUP_U',
			'p1_REGISTRY_PROJECT_GROUP_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_GROUP_RESTORE',
			'p1_REGISTRY_PROJECT_GROUP_D',
			'p1_REGISTRY_PROJECT_GROUP_R',
		]);
		facade = {
			softDeleteGroup: vi.fn(() => of(undefined)),
			restoreGroup: vi.fn(() => of(undefined)),
			hardDeleteGroup: vi.fn(() => of(undefined)),
		};
		confirm = vi.fn();
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			providers: [
				GroupActions,
				{ provide: GroupFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ authorities: authorities() }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm } },
				{ provide: Router, useValue: { navigateByUrl } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		actions = TestBed.inject(GroupActions);
	});

	function ids(element: GroupModel): string[] {
		return actions.actionsFor(element).map((action) => action.id);
	}

	function find(element: GroupModel, id: string): ElementActionModel {
		return defined(actions.actionsFor(element).find((action) => action.id === id));
	}

	it('offers the history, edit, hide and delete commands for a visible element', () => {
		// Arrange
		const element = VISIBLE;

		// Act
		const shown = ids(element);

		// Assert
		expect(shown).toEqual(['members', 'edit', 'softDelete', 'hardDelete']);
	});

	it('offers show instead of hide for a hidden element', () => {
		// Arrange
		const element: GroupModel = HIDDEN;

		// Act
		const shown = ids(element);

		// Assert
		expect(shown).toEqual(['members', 'edit', 'restore', 'hardDelete']);
	});

	it('gates softDelete and restore on their own authorities', () => {
		// Arrange
		const disabled = (element: GroupModel, id: string): boolean =>
			defined(actions.actionsFor(element).find((it) => it.id === id)).disabled;
		authorities.set(['p1_REGISTRY_PROJECT_GROUP_U', 'p1_REGISTRY_PROJECT_GROUP_D']);

		// Act
		const without = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];
		authorities.set([
			'p1_REGISTRY_PROJECT_GROUP_U',
			'p1_REGISTRY_PROJECT_GROUP_D',
			'p1_REGISTRY_PROJECT_GROUP_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_GROUP_RESTORE',
		]);
		const withThem = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];

		// Assert
		expect(without).toEqual([true, true]);
		expect(withThem).toEqual([false, false]);
	});

	it('disables the commands the user has no authority for', () => {
		// Arrange
		authorities.set(['p1_REGISTRY_PROJECT_GROUP_U']);

		// Act
		const flags = ['members', 'edit', 'hardDelete'].map((id) => find(VISIBLE, id).disabled);

		// Assert
		expect(flags).toEqual([true, false, true]);
	});

	it('opens the history and edition routes of the element', () => {
		// Arrange
		const history = find(VISIBLE, 'members');
		const edit = find(VISIBLE, 'edit');

		// Act
		history.run();
		edit.run();

		// Assert
		expect(navigateByUrl).toHaveBeenNthCalledWith(1, expect.stringContaining('x1'));
		expect(navigateByUrl).toHaveBeenNthCalledWith(2, expect.stringContaining('x1'));
	});

	it.each([
		['softDelete', 'softDeleteGroup', SeverityEnum.WARNING, VISIBLE, 'x1'],
		['restore', 'restoreGroup', SeverityEnum.INFO, HIDDEN, 'x1'],
		['hardDelete', 'hardDeleteGroup', SeverityEnum.DANGER, VISIBLE, VISIBLE],
	])(
		'asks for a confirmation before running %s, then calls the facade',
		(id, call, severity, element, argument: unknown) => {
			// Arrange
			const action = find(element, id);

			// Act
			action.run();
			const beforeAccept = facade[call].mock.calls.length;
			confirm.mock.calls[0][0].accept();

			// Assert
			expect(beforeAccept).toBe(0);
			expect(confirm.mock.calls[0][0].acceptSeverity).toBe(severity);
			expect(facade[call]).toHaveBeenCalledWith(argument);
		},
	);

	it('exposes the members command as the primary action', () => {
		// Arrange
		const element = VISIBLE;

		// Act
		const primary = actions.primaryFor(element);

		// Assert
		expect(primary?.id).toBe('members');
	});

	it('leaves the primary action out of the menu', () => {
		// Arrange
		const element = VISIBLE;

		// Act
		const menu = actions.menuFor(element).map((action) => action.id);

		// Assert
		expect(menu).not.toContain('members');
		expect(menu).toContain('edit');
	});

	it('stays on the page when the navigation fails', async () => {
		// Arrange
		navigateByUrl.mockRejectedValue(new Error('denied'));
		const members = defined(actions.actionsFor(VISIBLE).find((action) => action.id === 'members'));

		// Act
		members.run();
		await Promise.resolve();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledTimes(1);
	});
});
