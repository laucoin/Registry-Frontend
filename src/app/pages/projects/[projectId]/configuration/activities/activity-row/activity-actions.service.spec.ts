import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoService } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ActivityActions } from '@pages/projects/[projectId]/configuration/activities/activity-row/activity-actions.service';
import { ActivityFacade } from '@pages/projects/[projectId]/configuration/activities/data/state/activity.facade';
import { defined } from '@shared/helpers/testing/defined';
import { SeverityEnum } from '@shared/models/enumeration/severity.enum';
import { ActivityModel } from '@shared/models/model/activity.model';
import { ElementActionModel } from '@shared/models/model/element-action.model';

const VISIBLE = { id: 'x1', visible: true } as ActivityModel;
const HIDDEN: ActivityModel = { ...VISIBLE, visible: false };

describe('ActivityActions', () => {
	let actions: ActivityActions;
	let authorities: WritableSignal<string[]>;
	let facade: Record<string, Mock>;
	let confirm: Mock<(confirmation: { accept: () => void; acceptSeverity: SeverityEnum }) => void>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	beforeEach(() => {
		authorities = signal([
			'p1_REGISTRY_PROJECT_ACTIVITY_U',
			'p1_REGISTRY_PROJECT_ACTIVITY_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_ACTIVITY_RESTORE',
			'p1_REGISTRY_PROJECT_ACTIVITY_D',
			'p1_REGISTRY_PROJECT_ACTIVITY_HISTORY_R',
		]);
		facade = {
			softDeleteActivity: vi.fn(() => of(undefined)),
			restoreActivity: vi.fn(() => of(undefined)),
			hardDeleteActivity: vi.fn(() => of(undefined)),
		};
		confirm = vi.fn();
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			providers: [
				ActivityActions,
				{ provide: ActivityFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ authorities: authorities() }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm } },
				{ provide: Router, useValue: { navigateByUrl, url: '/list?q=ada' } },
				{ provide: TranslocoService, useValue: { translate: (key: string): string => key } },
			],
		});
		actions = TestBed.inject(ActivityActions);
	});

	function ids(element: ActivityModel): string[] {
		return actions.actionsFor(element).map((action) => action.id);
	}

	function find(element: ActivityModel, id: string): ElementActionModel {
		return defined(actions.actionsFor(element).find((action) => action.id === id));
	}

	it('offers the history, edit, hide and delete commands for a visible element', () => {
		// Arrange
		const element = VISIBLE;

		// Act
		const shown = ids(element);

		// Assert
		expect(shown).toEqual(['movements-history', 'edit', 'softDelete', 'hardDelete']);
	});

	it('offers show instead of hide for a hidden element', () => {
		// Arrange
		const element: ActivityModel = HIDDEN;

		// Act
		const shown = ids(element);

		// Assert
		expect(shown).toEqual(['movements-history', 'edit', 'restore', 'hardDelete']);
	});

	it('gates softDelete and restore on their own authorities', () => {
		// Arrange
		const disabled = (element: ActivityModel, id: string): boolean =>
			defined(actions.actionsFor(element).find((it) => it.id === id)).disabled;
		authorities.set(['p1_REGISTRY_PROJECT_ACTIVITY_U', 'p1_REGISTRY_PROJECT_ACTIVITY_D']);

		// Act
		const without = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];
		authorities.set([
			'p1_REGISTRY_PROJECT_ACTIVITY_U',
			'p1_REGISTRY_PROJECT_ACTIVITY_D',
			'p1_REGISTRY_PROJECT_ACTIVITY_SOFT_DELETE',
			'p1_REGISTRY_PROJECT_ACTIVITY_RESTORE',
		]);
		const withThem = [disabled(VISIBLE, 'softDelete'), disabled(HIDDEN, 'restore')];

		// Assert
		expect(without).toEqual([true, true]);
		expect(withThem).toEqual([false, false]);
	});

	it('disables the commands the user has no authority for', () => {
		// Arrange
		authorities.set(['p1_REGISTRY_PROJECT_ACTIVITY_U']);

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
		expect(navigateByUrl).toHaveBeenNthCalledWith(1, expect.stringMatching(/x1[^?]*$/));
		expect(navigateByUrl).toHaveBeenNthCalledWith(2, expect.stringMatching(/x1.*\?q=ada$/));
	});

	it.each([
		['softDelete', 'softDeleteActivity', SeverityEnum.WARNING, VISIBLE, 'x1'],
		['restore', 'restoreActivity', SeverityEnum.INFO, HIDDEN, 'x1'],
		['hardDelete', 'hardDeleteActivity', SeverityEnum.DANGER, VISIBLE, VISIBLE],
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
});
