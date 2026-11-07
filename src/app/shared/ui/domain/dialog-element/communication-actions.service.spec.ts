import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { ElementConfirmationService } from '@shared/helpers/facade/element-confirmation.service';
import { defined } from '@shared/helpers/testing/defined';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { ElementActionModel } from '@shared/models/model/element-action.model';
import { CommunicationActions } from '@shared/ui/domain/dialog-element/communication-actions.service';

const VISIBLE = { id: 'x1', visible: true } as unknown as CommunicationModel;
const HIDDEN: CommunicationModel = { ...VISIBLE, visible: false };

describe('CommunicationActions', () => {
	let actions: CommunicationActions;
	let authorities: WritableSignal<string[]>;
	let facade: Record<string, Mock>;
	let confirm: Mock<(prefix: string, element: unknown, severity: unknown, accept: () => void) => void>;

	const find = (element: CommunicationModel, id: string): ElementActionModel =>
		defined(actions.actionsFor(element).find((action) => action.id === id));

	beforeEach(() => {
		authorities = signal([
			'p1_REGISTRY_PROJECT_COMMUNICATION_U',
			'p1_REGISTRY_PROJECT_COMMUNICATION_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_COMMUNICATION_RESTORE',
			'p1_REGISTRY_PROJECT_COMMUNICATION_D',
		]);
		facade = {
			softDeleteCommunication: vi.fn(() => of(undefined)),
			restoreCommunication: vi.fn(() => of(undefined)),
			hardDeleteCommunication: vi.fn(() => of(undefined)),
			fetchCommunication: vi.fn(),
		};
		confirm = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				CommunicationActions,
				{ provide: CommunicationFacade, useValue: facade },
				{ provide: ElementConfirmationService, useValue: { confirm } },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ authorities: authorities() }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
			],
		});
		actions = TestBed.inject(CommunicationActions);
	});

	it('offers the edit, hide and delete commands for a visible element', () => {
		// Arrange
		const element = VISIBLE;

		// Act
		const ids = actions.actionsFor(element).map((action) => action.id);

		// Assert
		expect(ids).toEqual(['edit', 'softDelete', 'hardDelete']);
	});

	it('offers the show command instead of hide for a hidden element', () => {
		// Arrange
		const element: CommunicationModel = HIDDEN;

		// Act
		const ids = actions.actionsFor(element).map((action) => action.id);

		// Assert
		expect(ids).toEqual(['edit', 'restore', 'hardDelete']);
	});

	it.each([
		['softDelete', 'softDeleteCommunication', VISIBLE],
		['restore', 'restoreCommunication', HIDDEN],
	])('asks for a confirmation before running %s, then calls the facade with the identifier', (id, call, element) => {
		// Arrange
		const action = find(element, id);

		// Act
		action.run();
		confirm.mock.calls[0][3]();

		// Assert
		expect(facade[call]).toHaveBeenCalledWith('x1');
	});

	it('asks for a confirmation before deleting, then deletes the element', () => {
		// Arrange
		const action = find(VISIBLE, 'hardDelete');

		// Act
		action.run();
		confirm.mock.calls[0][3]();

		// Assert
		expect(facade['hardDeleteCommunication']).toHaveBeenCalledWith(VISIBLE);
	});

	it('gates softDelete and restore on their own authorities', () => {
		// Arrange
		const disabled = (element: CommunicationModel, id: string): boolean =>
			defined(actions.actionsFor(element).find((it) => it.id === id)).disabled;
		authorities.set(['p1_REGISTRY_PROJECT_COMMUNICATION_U', 'p1_REGISTRY_PROJECT_COMMUNICATION_D']);

		// Act
		const without = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];
		authorities.set([
			'p1_REGISTRY_PROJECT_COMMUNICATION_U',
			'p1_REGISTRY_PROJECT_COMMUNICATION_D',
			'p1_REGISTRY_PROJECT_COMMUNICATION_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_COMMUNICATION_RESTORE',
		]);
		const withThem = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];

		// Assert
		expect(without).toEqual([true, true]);
		expect(withThem).toEqual([false, false]);
	});

	it('disables the commands the user has no authority for', () => {
		// Arrange
		authorities.set(['p1_REGISTRY_PROJECT_COMMUNICATION_U', 'p1_REGISTRY_PROJECT_COMMUNICATION_SOFT_DELETE']);

		// Act
		const [edit, hide, remove]: ElementActionModel[] = actions.actionsFor(VISIBLE);

		// Assert
		expect(edit.disabled).toBe(false);
		expect(hide.disabled).toBe(false);
		expect(remove.disabled).toBe(true);
	});

	it('loads the communication in the form when the user edits it', () => {
		// Arrange
		const edit = find(VISIBLE, 'edit');

		// Act
		edit.run();

		// Assert
		expect(facade['fetchCommunication']).toHaveBeenCalledWith('x1');
	});
});
