import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Signal, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { NEVER, Observable } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { communicationFacadeStub } from '@pages/projects/[projectId]/movements/communication/data/testing/communication-facade.stub';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { ClockService } from '@shared/helpers/clock.service';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { DetailsButtonEnum } from '@shared/ui/domain/movement-element/movement-details/testing/movement-details.harness';
import { MovementElementComponent } from '@shared/ui/domain/movement-element/movement-element.component';
import {
	MovementDrawerEnum,
	MovementElementHarness,
} from '@shared/ui/domain/movement-element/testing/movement-element.harness';
import { movementOf } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

describe('MovementElementComponent', () => {
	let fixture: ComponentFixture<MovementElementComponent>;
	let confirm: Mock<(confirmation: { accept: () => void }) => void>;
	let movementFacade: Record<string, Mock>;
	let canCreate: WritableSignal<boolean>;
	let openReverse: Mock<(movement: MovementModel, contents?: unknown[]) => void>;
	let communicationOption: WritableSignal<boolean>;

	const layerOpened = (drawer: string): boolean =>
		(fixture.componentInstance as unknown as Record<string, () => boolean>)[`${drawer}LayerOpened`]();

	async function create(
		movement: MovementModel,
		inputs: Record<string, unknown> = {},
	): Promise<MovementElementHarness> {
		fixture = TestBed.createComponent(MovementElementComponent);
		fixture.componentRef.setInput('movement', movement);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementElementHarness);
	}

	beforeEach(() => {
		confirm = vi.fn();
		movementFacade = Object.assign(autoMock(undefined), {
			movementCommunicationsPage: signal(undefined),
			movementCommunicationsPageLoading: signal(false),
			movementCommunicationsPageSilentLoading: signal(false),
			movementCommunicationsPageError: signal(undefined),
			fetchMovementCommunicationsPage: vi.fn(),
		}) as unknown as Record<string, Mock>;
		canCreate = signal(true);
		openReverse = vi.fn();
		communicationOption = signal(false);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: MovementFacade, useValue: movementFacade },
				{ provide: CommunicationFacade, useValue: communicationFacadeStub() },
				{ provide: AlertFacade, useValue: { handleAlertCreation: (): Observable<never> => NEVER } },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({
							id: 'u1',
							authorities: [
								'p1_REGISTRY_PROJECT_MOVEMENT_U',
								'p1_REGISTRY_PROJECT_MOVEMENT_SOFT_DELETE',
								'p1_REGISTRY_PROJECT_MOVEMENT_RESTORE',
								'p1_REGISTRY_PROJECT_MOVEMENT_D',
							],
						}),
						selectedProject: signal({ id: 'p1', options: [] }),
						selectedProjectHasOption: (option: ProjectOptionEnum): Signal<boolean> =>
							option === ProjectOptionEnum.COMMUNICATION ? communicationOption : signal(false),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn(), confirm } },
				{ provide: MovementPrefillService, useValue: { canCreate, openReverse } },
				{ provide: ClockService, useValue: { now: signal(new Date('2026-01-05T10:00:00Z').getTime()) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
			],
		});
	});

	describe('the row', () => {
		it.each([
			{ name: 'an arrival', value: 'IN', icon: 'arrow-down', variant: 'success' },
			{ name: 'a departure', value: 'OUT', icon: 'arrow-up', variant: 'warning' },
		])('shows $name with its icon and colour', async ({ value, icon, variant }) => {
			// Arrange
			const movement = movementOf({ type: { value, label: 'Type' } as MovementModel['type'] });

			// Act
			const harness = await create(movement);

			// Assert
			expect([await harness.typeIconName(), await harness.avatarVariant()]).toEqual([icon, variant]);
		});

		it.each([
			{
				name: 'appends the reason to the type',
				label: 'Arrival',
				reason: { label: 'Camp' },
				expected: 'Arrival - Camp',
			},
			{ name: 'shows only the type without reason', label: 'Arrival', reason: undefined, expected: 'Arrival' },
			{
				name: 'shows only the reason when the type has no label',
				label: null,
				reason: { label: 'Camp' },
				expected: '- Camp',
			},
		])('$name', async ({ label, reason, expected }) => {
			// Arrange
			const movement = movementOf({ type: { value: 'IN', label }, reason } as Partial<MovementModel>);

			// Act
			const harness = await create(movement);

			// Assert
			expect(await harness.title()).toBe(expected);
		});

		it('marks a hidden movement and disables its row', async () => {
			// Arrange
			const movement = movementOf({ visible: false });

			// Act
			const harness = await create(movement);

			// Assert
			expect([await harness.hiddenShown(), await harness.disabled()]).toEqual([true, true]);
		});

		it('keeps a visible movement enabled and unmarked', async () => {
			// Arrange
			const movement = movementOf();

			// Act
			const harness = await create(movement);

			// Assert
			expect([await harness.hiddenShown(), await harness.disabled()]).toEqual([false, false]);
		});
	});

	describe('the actions', () => {
		it.each([
			{ name: 'a visible movement', visible: true, expected: ['edit', 'softDelete', 'hardDelete'] },
			{ name: 'a hidden movement', visible: false, expected: ['edit', 'restore', 'hardDelete'] },
		])('lists the actions of $name in a stable order', async ({ visible, expected }) => {
			// Arrange
			const harness = await create(movementOf({ visible }));

			// Act
			const actions = await (await harness.actions()).actions();

			// Assert
			expect(actions.map((action) => action.id)).toEqual(expected);
		});

		it('asks for a confirmation before deleting, then deletes the movement', async () => {
			// Arrange
			const harness = await create(movementOf());

			// Act
			await (await harness.actions()).run('hardDelete');
			defined(confirm.mock.calls[0])[0].accept();

			// Assert
			expect(movementFacade['hardDeleteMovement']).toHaveBeenCalledTimes(1);
		});

		it('hides the actions when the list asks for it', async () => {
			// Arrange
			const harness = await create(movementOf(), { actionMenuVisible: false });

			// Act
			const shown = await (await harness.actions()).shown();

			// Assert
			expect(shown).toBe(false);
		});
	});

	describe('the reverse movement', () => {
		it.each([
			{ name: 'unless the list asks for it', reversible: false, allowed: true, expected: false },
			{ name: 'unless the user can create movements', reversible: true, allowed: false, expected: false },
			{
				name: 'when the list is reversible and the user can create movements',
				reversible: true,
				allowed: true,
				expected: true,
			},
		])('offers it $name', async ({ reversible, allowed, expected }) => {
			// Arrange
			canCreate.set(allowed);

			// Act
			const harness = await create(movementOf(), { reversible });

			// Assert
			expect(await harness.canReverse()).toBe(expected);
		});

		it('asks the prefill service for the reverse of the whole movement', async () => {
			// Arrange
			const movement = movementOf();
			const harness = await create(movement, { reversible: true });

			// Act
			await harness.reverse();

			// Assert
			expect(openReverse).toHaveBeenCalledWith(movement, undefined);
		});

		it('asks the prefill service for the reverse of a single person', async () => {
			// Arrange
			const movement = movementOf();
			const harness = await create(movement, { reversible: true });

			// Act
			await (await (await harness.participants()).panels())[0].reverse('bob');

			// Assert
			expect(openReverse).toHaveBeenCalledWith(movement, [movement.content[1]]);
		});
	});

	describe('the layers', () => {
		it.each([
			{ name: 'people', button: DetailsButtonEnum.PARTICIPANTS, drawer: MovementDrawerEnum.PARTICIPANTS },
			{ name: 'vehicles', button: DetailsButtonEnum.VEHICLES, drawer: MovementDrawerEnum.VEHICLES },
		])('opens the $name layer from the detail and closes it when the layer asks', async ({ button, drawer }) => {
			// Arrange
			const harness = await create(movementOf());
			await (await harness.details()).click(button);
			const opened = await harness.opened(drawer);

			// Act
			await harness.hide(drawer);

			// Assert
			expect([opened, layerOpened(drawer)]).toEqual([true, false]);
		});

		it.each([
			{ name: 'people', drawer: 'participants', inner: 'app-movement-participants' },
			{ name: 'vehicles', drawer: 'vehicles', inner: 'app-movement-vehicles' },
			{
				name: 'communications',
				drawer: 'communications',
				inner: '[data-test-id="movement-element-drawer-actions"]',
			},
		])('keeps the $name layer open when an element inside it hides its own panel', async ({ drawer, inner }) => {
			// Arrange
			communicationOption.set(true);
			const harness = await create(movementOf(), { communicable: true });
			(fixture.componentInstance as unknown as Record<string, { set: (open: boolean) => void }>)[
				`${drawer}LayerOpened`
			].set(true);
			await harness.title();
			const element: HTMLElement = fixture.nativeElement.querySelector(inner);

			// Act
			element.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

			// Assert
			expect(layerOpened(drawer)).toBe(true);
		});

		it('lists the vehicles of the movement in their layer', async () => {
			// Arrange
			const harness = await create(movementOf());

			// Act
			const vehicles = await (await harness.vehicles()).vehicles();

			// Assert
			expect(vehicles.map((vehicle) => vehicle.id)).toEqual(['v1']);
		});
	});

	describe('the communications', () => {
		it.each([
			{
				name: 'a communicable movement of a project with the option',
				communicable: true,
				option: true,
				expected: true,
			},
			{ name: 'a movement that is not communicable', communicable: false, option: true, expected: false },
			{ name: 'a project without the option', communicable: true, option: false, expected: false },
		])('are offered for $name', async ({ communicable, option, expected }) => {
			// Arrange
			communicationOption.set(option);

			// Act
			const harness = await create(movementOf(), { communicable });

			// Assert
			expect(await harness.canCommunicate()).toBe(expected);
		});

		it('opens the communications layer with the communication form, and closes it when the layer asks', async () => {
			// Arrange
			communicationOption.set(true);
			const harness = await create(movementOf(), { communicable: true });

			// Act
			await harness.openCommunications();
			const shown = [
				await harness.opened(MovementDrawerEnum.COMMUNICATIONS),
				await harness.communicationFormShown(),
			];
			await harness.hide(MovementDrawerEnum.COMMUNICATIONS);

			// Assert
			expect(shown).toEqual([true, true]);
			expect(layerOpened('communications')).toBe(false);
		});
	});
});
