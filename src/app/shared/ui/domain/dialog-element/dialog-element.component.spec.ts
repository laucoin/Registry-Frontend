import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { CommunicationModel } from '@shared/models/model/communication.model';
import { DialogElementComponent } from '@shared/ui/domain/dialog-element/dialog-element.component';
import { DialogElementHarness } from '@shared/ui/domain/dialog-element/testing/dialog-element.harness';

const EDITOR: object = { id: 'u1', firstName: 'Ada', lastName: 'Lovelace' };
const ELEMENT = { id: 'e1', visible: true, message: 'On my way', dateTime: new Date('2026-01-01T10:00:00Z') };

describe('DialogElementComponent', () => {
	let fixture: ComponentFixture<DialogElementComponent>;
	let confirm: Mock<(confirmation: { accept: () => void }) => void>;
	let facade: Record<string, Mock>;

	async function create(element: object, inputs: Record<string, unknown> = {}): Promise<DialogElementHarness> {
		fixture = TestBed.createComponent(DialogElementComponent);
		fixture.componentRef.setInput('communication', element as CommunicationModel);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, DialogElementHarness);
	}

	beforeEach(() => {
		confirm = vi.fn();
		facade = autoMock(undefined);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: CommunicationFacade, useValue: facade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({
							id: 'u1',
							authorities: [
								'p1_REGISTRY_PROJECT_COMMUNICATION_U',
								'p1_REGISTRY_PROJECT_COMMUNICATION_SOFT_DELETE',
								'p1_REGISTRY_PROJECT_COMMUNICATION_RESTORE',
								'p1_REGISTRY_PROJECT_COMMUNICATION_D',
							],
						}),
						selectedProject: signal({ id: 'p1', options: [] }),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn(), confirm } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: {} },
			],
		});
	});

	describe('the author', () => {
		it('places a message written by the current user on its own side, without author nor avatar', async () => {
			// Arrange
			const element = { ...ELEMENT, lastEdition: { user: EDITOR } };

			// Act
			const harness = await create(element);

			// Assert
			expect([await harness.own(), await harness.authorName(), await harness.avatarShown()]).toEqual([
				true,
				undefined,
				false,
			]);
		});

		it.each([
			{
				name: 'by the reason of the movement that sent it',
				element: {
					...ELEMENT,
					movement: { id: 'm1', reason: { label: 'Arrival' } },
					lastEdition: { user: EDITOR },
				},
				expected: 'Arrival',
			},
			{
				name: 'by its last editor',
				element: { ...ELEMENT, lastEdition: { user: { id: 'u2', firstName: 'Bob', lastName: 'Martin' } } },
				expected: 'Bob Martin',
			},
			{
				name: 'with the unknown author label',
				element: ELEMENT,
				expected: 'fr.communications.no-author',
				previous: 'someone',
			},
		])('names the author of a message $name', async ({ element, expected, previous }) => {
			// Arrange
			const inputs = { previousAuthorId: previous };

			// Act
			const harness = await create(element, inputs);

			// Assert
			expect([await harness.own(), await harness.authorName()]).toEqual([false, expected]);
		});

		it.each([
			{ name: 'the same author', previous: 'u2', grouped: true },
			{ name: 'another author', previous: 'u3', grouped: false },
			{ name: 'no message', previous: undefined, grouped: false },
		])('groups a message after $name', async ({ previous, grouped }) => {
			// Arrange
			const element = { ...ELEMENT, lastEdition: { user: { id: 'u2', firstName: 'Bob', lastName: 'Martin' } } };

			// Act
			const harness = await create(element, { previousAuthorId: previous });

			// Assert
			expect([await harness.grouped(), await harness.avatarShown()]).toEqual([grouped, !grouped]);
		});
	});

	describe('the message', () => {
		it('shows the message, unmarked when visible and never edited', async () => {
			// Arrange
			const harness = await create(ELEMENT);

			// Act
			const shown = [await harness.text(), await harness.hiddenShown(), await harness.updatedShown()];

			// Assert
			expect(shown).toEqual(['On my way', false, false]);
		});

		it('marks a hidden message and a message edited after its creation', async () => {
			// Arrange
			const element = {
				...ELEMENT,
				visible: false,
				creation: { dateTime: new Date('2026-01-01') },
				lastEdition: { dateTime: new Date('2026-01-02'), user: EDITOR },
			};

			// Act
			const harness = await create(element);

			// Assert
			expect([await harness.hiddenShown(), await harness.updatedShown()]).toEqual([true, true]);
		});

		it.each([
			{
				name: 'its title',
				alert: { title: 'Fire', status: { value: 'IN_PROGRESS', label: 'In progress' } },
				expected: { title: 'Fire', status: 'In progress', variant: 'warning' },
			},
			{
				name: 'the untitled label for a blank title',
				alert: { title: ' ', status: { value: 'IN_PROGRESS', label: 'In progress' } },
				expected: { title: 'fr.alerts.untitled', status: 'In progress', variant: 'warning' },
			},
		])('quotes the alert of the message with $name when asked', async ({ alert, expected }) => {
			// Arrange
			const element = { ...ELEMENT, alert };

			// Act
			const harness = await create(element, { alertVisible: true });

			// Assert
			expect(await harness.alert()).toEqual(expected);
		});

		it('does not quote the alert unless asked', async () => {
			// Arrange
			const element = {
				...ELEMENT,
				alert: { title: 'Fire', status: { value: 'IN_PROGRESS', label: 'In progress' } },
			};

			// Act
			const harness = await create(element);

			// Assert
			expect(await harness.alert()).toBeUndefined();
		});
	});

	describe('the actions', () => {
		it.each([
			{ name: 'a visible message', visible: true, expected: ['edit', 'softDelete', 'hardDelete'] },
			{ name: 'a hidden message', visible: false, expected: ['edit', 'restore', 'hardDelete'] },
		])('lists the actions of $name', async ({ visible, expected }) => {
			// Arrange
			const harness = await create({ ...ELEMENT, visible });

			// Act
			const actions = await (await harness.actions()).actions();

			// Assert
			expect(actions.map((action) => action.id)).toEqual(expected);
		});

		it('asks for a confirmation before deleting, then deletes the message', async () => {
			// Arrange
			const harness = await create(ELEMENT);

			// Act
			await (await harness.actions()).run('hardDelete');
			defined(confirm.mock.calls[0])[0].accept();

			// Assert
			expect(facade['hardDeleteCommunication']).toHaveBeenCalledTimes(1);
		});

		it('loads the message in the form when the user edits it', async () => {
			// Arrange
			const harness = await create(ELEMENT);

			// Act
			await (await harness.actions()).run('edit');

			// Assert
			expect(facade['fetchCommunication']).toHaveBeenCalledWith('e1');
		});
	});
});
