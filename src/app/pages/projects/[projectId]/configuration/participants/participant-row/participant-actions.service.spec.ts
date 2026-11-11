import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantActions } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-actions.service';
import { defined } from '@shared/helpers/testing/defined';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ElementActionModel } from '@shared/models/model/element-action.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const VISIBLE = { id: 'x1', visible: true } as ParticipantModel;
const HIDDEN: ParticipantModel = { ...VISIBLE, visible: false };

describe('ParticipantActions', () => {
	let actions: ParticipantActions;
	let authorities: WritableSignal<string[]>;
	let facade: Record<string, Mock>;
	let groupFacade: { removeMemberFromGroup: Mock };
	let confirm: Mock<(confirmation: { accept: () => void; acceptSeverity: SeverityEnum }) => void>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	beforeEach(() => {
		authorities = signal([
			'p1_REGISTRY_PROJECT_PARTICIPANT_U',
			'p1_REGISTRY_PROJECT_PARTICIPANT_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_PARTICIPANT_RESTORE',
			'p1_REGISTRY_PROJECT_PARTICIPANT_D',
			'p1_REGISTRY_PROJECT_PARTICIPANT_HISTORY_R',
		]);
		facade = {
			softDeleteParticipant: vi.fn(() => of(undefined)),
			restoreParticipant: vi.fn(() => of(undefined)),
			hardDeleteParticipant: vi.fn(() => of(undefined)),
			exportParticipant: vi.fn(() => of(undefined)),
		};
		groupFacade = { removeMemberFromGroup: vi.fn(() => of(undefined)) };
		confirm = vi.fn();
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			providers: [
				ParticipantActions,
				{ provide: ParticipantFacade, useValue: facade },
				{ provide: GroupFacade, useValue: groupFacade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'me', authorities: authorities() }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm } },
				{ provide: Router, useValue: { navigateByUrl } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		actions = TestBed.inject(ParticipantActions);
	});

	function ids(element: ParticipantModel, groupId?: string): string[] {
		return actions.actionsFor(element, groupId).map((action) => action.id);
	}

	function find(element: ParticipantModel, id: string): ElementActionModel {
		return defined(actions.actionsFor(element).find((action) => action.id === id));
	}

	it('offers the history, edit, hide, export and delete commands for a visible element', () => {
		// Arrange
		const element = VISIBLE;

		// Act
		const shown = ids(element);

		// Assert
		expect(shown).toEqual(['movements-history', 'edit', 'softDelete', 'export', 'hardDelete']);
	});

	it('offers restore instead of soft delete for a deleted participant', () => {
		// Arrange
		const element: ParticipantModel = HIDDEN;

		// Act
		const shown = ids(element);

		// Assert
		expect(shown).toEqual(['movements-history', 'edit', 'restore', 'export', 'hardDelete']);
	});

	it('disables the export for a user who is neither an administrator nor the linked user', () => {
		// Arrange
		const element = { ...VISIBLE, user: { id: 'other' } } as ParticipantModel;

		// Act
		const disabled = find(element, 'export').disabled;

		// Assert
		expect(disabled).toBe(true);
	});

	it('allows the export to the user linked to the participant', () => {
		// Arrange
		const element = { ...VISIBLE, user: { id: 'me' } } as ParticipantModel;

		// Act
		const disabled = find(element, 'export').disabled;

		// Assert
		expect(disabled).toBe(false);
	});

	it('allows the export to a project administrator and runs it', () => {
		// Arrange
		authorities.set(['p1_REGISTRY_PROJECT_PARTICIPANT_EXPORT']);
		const exportAction = find(VISIBLE, 'export');

		// Act
		exportAction.run();

		// Assert
		expect(exportAction.disabled).toBe(false);
		expect(facade['exportParticipant']).toHaveBeenCalledWith(VISIBLE);
	});

	it('gates softDelete and restore on their own authorities', () => {
		// Arrange
		const disabled = (element: ParticipantModel, id: string): boolean =>
			defined(actions.actionsFor(element).find((it) => it.id === id)).disabled;
		authorities.set(['p1_REGISTRY_PROJECT_PARTICIPANT_U', 'p1_REGISTRY_PROJECT_PARTICIPANT_D']);

		// Act
		const without = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];
		authorities.set([
			'p1_REGISTRY_PROJECT_PARTICIPANT_U',
			'p1_REGISTRY_PROJECT_PARTICIPANT_D',
			'p1_REGISTRY_PROJECT_PARTICIPANT_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_PARTICIPANT_RESTORE',
		]);
		const withThem = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];

		// Assert
		expect(without).toEqual([true, true]);
		expect(withThem).toEqual([false, false]);
	});

	it('disables the commands the user has no authority for', () => {
		// Arrange
		authorities.set(['p1_REGISTRY_PROJECT_PARTICIPANT_U']);

		// Act
		const flags = ['movements-history', 'edit', 'hardDelete'].map((id) => find(VISIBLE, id).disabled);

		// Assert
		expect(flags).toEqual([true, false, true]);
	});

	it('opens the history and edition routes of the element', () => {
		// Arrange
		const history = find(VISIBLE, 'movements-history');
		const edit = find(VISIBLE, 'edit');

		// Act
		history.run();
		edit.run();

		// Assert
		expect(navigateByUrl).toHaveBeenNthCalledWith(1, expect.stringContaining('x1'));
		expect(navigateByUrl).toHaveBeenNthCalledWith(2, expect.stringContaining('x1'));
	});

	it.each([
		['softDelete', 'softDeleteParticipant', SeverityEnum.WARNING, VISIBLE, 'x1'],
		['restore', 'restoreParticipant', SeverityEnum.INFO, HIDDEN, 'x1'],
		['hardDelete', 'hardDeleteParticipant', SeverityEnum.DANGER, VISIBLE, VISIBLE],
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

	it('offers to remove the participant from the group it is listed in', () => {
		// Arrange
		const element = VISIBLE;

		// Act
		const shown = ids(element, 'g1');

		// Assert
		expect(shown).toEqual(['movements-history', 'edit', 'softDelete', 'remove-member', 'export', 'hardDelete']);
	});

	it('asks for a confirmation before removing a member, then calls the group facade', () => {
		// Arrange
		authorities.set(['p1_REGISTRY_PROJECT_GROUP_U']);
		const action = defined(actions.actionsFor(VISIBLE, 'g1').find((entry) => entry.id === 'remove-member'));

		// Act
		action.run();
		confirm.mock.calls[0][0].accept();

		// Assert
		expect(action.disabled).toBe(false);
		expect(confirm.mock.calls[0][0].acceptSeverity).toBe(SeverityEnum.WARNING);
		expect(groupFacade.removeMemberFromGroup).toHaveBeenCalledWith('g1', VISIBLE);
	});

	it('stays on the page when the navigation fails', async () => {
		// Arrange
		navigateByUrl.mockRejectedValue(new Error('denied'));
		const history = find(VISIBLE, 'movements-history');

		// Act
		history.run();
		await Promise.resolve();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledTimes(1);
	});

	it('removes nothing when no group page provides the group facade', () => {
		// Arrange
		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [
				ParticipantActions,
				{ provide: ParticipantFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'me', authorities: ['p1_REGISTRY_PROJECT_GROUP_U'] }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm } },
				{ provide: Router, useValue: { navigateByUrl } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		const action = defined(
			TestBed.inject(ParticipantActions)
				.actionsFor(VISIBLE, 'g1')
				.find((entry) => entry.id === 'remove-member'),
		);
		action.run();

		// Act
		confirm.mock.calls[0][0].accept();

		// Assert
		expect(groupFacade.removeMemberFromGroup).not.toHaveBeenCalled();
	});
});
