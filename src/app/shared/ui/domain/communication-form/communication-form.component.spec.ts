import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe, Location } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { BehaviorSubject, NEVER, Observable, of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { BrowserService } from '@core/browser/browser.service';
import { ConfigModel } from '@core/config/model/config.model';
import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { ALERT_DTO, COMMUNICATION_DTO, MOVEMENT_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { projectOptionChecker } from '@shared/helpers/testing/test-fixtures';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { NotificationModel } from '@shared/models/model/notification.model';
import { ProjectModel } from '@shared/models/model/project.model';
import { CommunicationFormComponent } from '@shared/ui/domain/communication-form/communication-form.component';
import { CommunicationFormHarness } from '@shared/ui/domain/communication-form/testing/communication-form.harness';

const ADD_MOVEMENT = 'communications.form.actions.add-movement';
const LINK_ALERT = 'communications.form.actions.link-alert';
const ADD_ALERT = 'communications.form.actions.add-alert';

interface Option {
	label: string;
	value: { id: string };
}

describe('CommunicationFormComponent', () => {
	let fixture: ComponentFixture<CommunicationFormComponent>;
	let communication: WritableSignal<object | undefined>;
	let communication$: BehaviorSubject<object | undefined>;
	let metadataErrors: WritableSignal<Record<string, NotificationModel>>;
	let searchedMovements: WritableSignal<Option[]>;
	let searchedAlerts: WritableSignal<Option[]>;
	let facade: Record<string, Mock>;
	let createAlert: Mock<(dto: object) => Observable<unknown>>;

	function provide(options: ProjectOptionEnum[], id: string | undefined): void {
		const project = signal<ProjectModel | undefined>({
			id: 'p1',
			options: options.map((value) => ({ label: value, value })),
		} as unknown as ProjectModel);
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { 'communications.form.hint.shortcut': '{{keys}} pour envoyer.' } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{ provide: CommunicationFacade, useValue: facade },
				{ provide: AlertFacade, useValue: { createAlert } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				DateFormatPipe,
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => '' } },
				{ provide: Location, useValue: { back: vi.fn() } },
				{ provide: Router, useValue: {} },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: id ? { communicationId: id } : {} } } },
				{
					provide: SessionFacade,
					useValue: {
						selectedProject: project,
						selectedProjectHasOption: projectOptionChecker(project),
						currentUser: signal(undefined),
					},
				},
				{ provide: UiFacade, useValue: autoMock() },
			],
		});
	}

	async function create(
		inputs: Record<string, unknown> = {},
		options: ProjectOptionEnum[] = [ProjectOptionEnum.ALERT],
		id: string | undefined = undefined,
	): Promise<CommunicationFormHarness> {
		provide(options, id);
		fixture = TestBed.createComponent(CommunicationFormComponent);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, CommunicationFormHarness);
	}

	beforeEach(() => {
		RegistryConfig.config = { notification: { duration: {} } } as unknown as ConfigModel;
		communication = signal(undefined);
		communication$ = new BehaviorSubject<object | undefined>(undefined);
		metadataErrors = signal({});
		searchedMovements = signal([]);
		searchedAlerts = signal([]);
		createAlert = vi.fn(() => of({}));
		facade = Object.assign(autoMock(), {
			communication,
			communication$,
			communicationError: signal(undefined),
			communicationLoading: signal(false),
			metadataErrors,
			searchedMovementsMetadata: searchedMovements,
			searchedAlertsMetadata: searchedAlerts,
		}) as unknown as Record<string, Mock>;
		facade['createCommunication'].mockReturnValue(of({}));
		facade['updateCommunication'].mockReturnValue(of({}));
	});

	describe('search failures', () => {
		it.each([
			{ name: 'movements', key: 'searchedMovements' },
			{ name: 'alerts', key: 'searchedAlerts' },
		])('shows the failure of the $name search', async ({ key }) => {
			// Arrange
			const harness = await create();

			// Act
			metadataErrors.set({ [key]: { summary: 'Search down' } });

			// Assert
			expect(await defined(await harness.searchError()).title()).toBe('Search down');
		});
	});

	describe('the menu', () => {
		it.each([
			{
				name: 'offers the movement and both alert links when the project has alerts',
				options: [ProjectOptionEnum.ALERT],
				expected: [ADD_MOVEMENT, LINK_ALERT, ADD_ALERT],
			},
			{
				name: 'hides the alert links when the project has no alert option',
				options: [],
				expected: [ADD_MOVEMENT],
			},
		])('$name', async ({ options, expected }) => {
			// Arrange
			const harness = await create({}, options);

			// Act
			const entries = await defined(await harness.menu()).entries();

			// Assert
			expect(entries.map((entry) => entry.key)).toEqual(expected);
		});

		it('is hidden when the initial movement and alert fix every link', async () => {
			// Arrange
			const inputs = { initialMovement: MOVEMENT_DTO, initialAlert: ALERT_DTO };

			// Act
			const harness = await create(inputs);

			// Assert
			expect(await harness.menu()).toBeNull();
		});

		it('shows the movement field and disables its entry once chosen', async () => {
			// Arrange
			const harness = await create();
			const menu = defined(await harness.menu());

			// Act
			await menu.run(ADD_MOVEMENT);

			// Assert
			expect(await harness.movementField()).not.toBeNull();
			expect((await menu.entries())[0].disabled).toBe(true);
		});

		it('shows the alert selection and disables both alert entries', async () => {
			// Arrange
			const harness = await create();
			const menu = defined(await harness.menu());

			// Act
			await menu.run(LINK_ALERT);

			// Assert
			expect(await harness.alertField()).not.toBeNull();
			expect((await menu.entries()).map((entry) => entry.disabled)).toEqual([false, true, true]);
		});
	});

	describe('saving', () => {
		it('does not save without a message', async () => {
			// Arrange
			const harness = await create({ initialMovement: MOVEMENT_DTO });

			// Act
			await harness.submit();

			// Assert
			expect(facade['createCommunication']).not.toHaveBeenCalled();
		});

		it('does not save without a movement or an alert, and says so', async () => {
			// Arrange
			const harness = await create();
			await harness.typeMessage('hello');

			// Act
			await harness.submit();

			// Assert
			expect(facade['createCommunication']).not.toHaveBeenCalled();
			expect(await (await harness.linkError()).text()).not.toBe('');
		});

		it('creates the communication linked to the initial movement, then empties the message', async () => {
			// Arrange
			const harness = await create({ initialMovement: MOVEMENT_DTO });
			let saved = 0;
			fixture.componentInstance.saved.subscribe(() => saved++);
			await harness.typeMessage('hello');

			// Act
			await harness.submit();

			// Assert
			expect(facade['createCommunication']).toHaveBeenCalledWith(
				expect.objectContaining({ message: 'hello', movementId: 'm1', alertId: undefined }),
			);
			expect(await harness.messageValue()).toBe('');
			expect(saved).toBe(1);
		});

		it('updates the loaded communication keeping its date', async () => {
			// Arrange
			const harness = await create({ initialAlert: ALERT_DTO }, [ProjectOptionEnum.ALERT], 'c1');
			communication.set({ ...COMMUNICATION_DTO, id: 'c1', dateTime: '2026-01-01T10:00:00.000Z' });
			await harness.typeMessage('edited');

			// Act
			await harness.submit();

			// Assert
			expect(facade['updateCommunication']).toHaveBeenCalledWith(
				'c1',
				expect.objectContaining({ dateTime: '2026-01-01T10:00:00.000Z' }),
				WHEN_ETAG,
			);
		});

		it('creates a new alert when the user asked for one', async () => {
			// Arrange
			const harness = await create({ initialMovement: MOVEMENT_DTO });
			await defined(await harness.menu()).run(ADD_ALERT);
			await harness.typeMessage('hello');
			await defined(await harness.newAlertField()).type('Fire');

			// Act
			await defined(await harness.newAlertField()).pressEnter();

			// Assert
			expect(createAlert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Fire', message: 'hello' }));
			expect(facade['createCommunication']).not.toHaveBeenCalled();
		});

		it('requires a title for a new alert', async () => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(ADD_ALERT);
			await harness.typeMessage('hello');

			// Act
			await harness.submit();

			// Assert
			expect(createAlert).not.toHaveBeenCalled();
			expect(await defined(await harness.newAlertField()).error()).not.toBe('');
		});

		it.each([
			{ name: 'Ctrl', modifier: { ctrlKey: true } },
			{ name: 'Cmd', modifier: { metaKey: true } },
		])('saves on $name + Enter in the message', async ({ modifier }) => {
			// Arrange
			const harness = await create({ initialMovement: MOVEMENT_DTO });
			await harness.typeMessage('hello');

			// Act
			await harness.pressOnMessage({ key: 'Enter', ...modifier });

			// Assert
			expect(facade['createCommunication']).toHaveBeenCalledTimes(1);
		});

		it.each([
			{ name: 'Enter alone', init: { key: 'Enter' } },
			{ name: 'Ctrl + another key', init: { key: 'a', ctrlKey: true } },
		])('does not save on $name', async ({ init }) => {
			// Arrange
			const harness = await create({ initialMovement: MOVEMENT_DTO });
			await harness.typeMessage('hello');

			// Act
			await harness.pressOnMessage(init);

			// Assert
			expect(facade['createCommunication']).not.toHaveBeenCalled();
		});

		it('does not save twice while a save is running, and disables the button meanwhile', async () => {
			// Arrange
			facade['createCommunication'].mockReturnValue(NEVER);
			const harness = await create({ initialMovement: MOVEMENT_DTO });
			await harness.typeMessage('hello');
			await harness.submit();

			// Act
			await harness.pressOnMessage({ key: 'Enter', ctrlKey: true });

			// Assert
			expect(facade['createCommunication']).toHaveBeenCalledTimes(1);
			expect(await harness.submitDisabled()).toBe(true);
		});
	});

	describe('editing', () => {
		it('fills the message of a loaded communication and offers to reset the edition', async () => {
			// Arrange
			const harness = await create({}, [ProjectOptionEnum.ALERT], 'c1');

			// Act
			communication.set({ ...COMMUNICATION_DTO, id: 'c1' });
			communication$.next({ ...COMMUNICATION_DTO, message: 'old', movement: MOVEMENT_DTO, alert: ALERT_DTO });

			// Assert
			expect(facade['fetchCommunication']).toHaveBeenCalledWith('c1');
			expect(await harness.messageValue()).toBe('old');
			expect([await harness.canReset(), await harness.submitIcon()]).toEqual([true, 'check']);
		});

		it('fills an empty message for a loaded communication without one', async () => {
			// Arrange
			const harness = await create({}, [ProjectOptionEnum.ALERT], 'c1');

			// Act
			communication$.next({ ...COMMUNICATION_DTO, message: undefined });

			// Assert
			expect(await harness.messageValue()).toBe('');
		});

		it('leaves the edition when reset', async () => {
			// Arrange
			const harness = await create({}, [ProjectOptionEnum.ALERT], 'c1');
			communication.set({ ...COMMUNICATION_DTO, id: 'c1' });
			communication$.next({ ...COMMUNICATION_DTO, message: 'old', movement: undefined, alert: undefined });
			facade['resetCommunication'].mockImplementation(() => communication.set(undefined));

			// Act
			await harness.reset();

			// Assert
			expect(await harness.messageValue()).toBe('');
			expect(await harness.submitIcon()).toBe('paper-plane');
		});
	});

	describe('the link fields', () => {
		it.each([
			{ name: 'movement', entry: ADD_MOVEMENT, field: 'movementField' as const },
			{ name: 'alert', entry: LINK_ALERT, field: 'alertField' as const },
		])('removes the $name field', async ({ entry, field }) => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(entry);

			// Act
			await defined(await harness[field]()).remove();

			// Assert
			expect(await harness[field]()).toBeNull();
		});

		it('removes the new alert field', async () => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(ADD_ALERT);

			// Act
			await defined(await harness.newAlertField()).remove();

			// Assert
			expect(await harness.newAlertField()).toBeNull();
		});

		it.each([
			{ name: 'movements', entry: ADD_MOVEMENT, field: 'movementField' as const, search: 'searchMovements' },
			{ name: 'alerts', entry: LINK_ALERT, field: 'alertField' as const, search: 'searchAlerts' },
		])('asks the facade to search the $name', async ({ entry, field, search }) => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(entry);

			// Act
			await defined(await harness[field]()).search('ca');

			// Assert
			expect(facade[search]).toHaveBeenCalledWith('ca');
		});

		it('links the movement chosen among the found ones and keeps it listed after a new search', async () => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(ADD_MOVEMENT);
			searchedMovements.set([{ label: 'First', value: { id: 'm1' } }]);
			const field = defined(await harness.movementField());

			// Act
			await field.choose('m1');
			searchedMovements.set([]);

			// Assert
			expect([await field.value(), await field.choices()]).toEqual(['m1', ['m1']]);
		});

		it.each([
			{ name: 'the choice is cleared', key: '' },
			{ name: 'the chosen key is not among the found ones', key: 'unknown' },
		])('unlinks the movement when $name', async ({ key }) => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(ADD_MOVEMENT);
			searchedMovements.set([{ label: 'First', value: { id: 'm1' } }]);
			const field = defined(await harness.movementField());
			await field.choose('m1');

			// Act
			await field.choose(key);

			// Assert
			expect(await field.value()).toBe('');
		});

		it('links the alert chosen among the found ones and unlinks an unknown one', async () => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(LINK_ALERT);
			searchedAlerts.set([{ label: 'Fire', value: { id: 'a1' } }]);
			const field = defined(await harness.alertField());

			// Act
			await field.choose('a1');
			const linked = await field.value();
			await field.choose('unknown');

			// Assert
			expect([linked, await field.value()]).toEqual(['a1', '']);
		});

		it('shows the error of the movement once the field is left empty', async () => {
			// Arrange
			const harness = await create();
			await defined(await harness.menu()).run(ADD_MOVEMENT);
			const field = defined(await harness.movementField());

			// Act
			await field.leave();

			// Assert
			expect(await field.error()).toBeDefined();
		});
	});

	describe('the shortcut hint', () => {
		it.each([
			{ name: 'Cmd on an Apple platform', apple: true, expected: '⌘ + ↵' },
			{ name: 'Ctrl elsewhere', apple: false, expected: 'Ctrl + ↵' },
		])('names $name', async ({ apple, expected }) => {
			// Arrange
			vi.spyOn(BrowserService.prototype, 'isApplePlatform', 'get').mockReturnValue(apple);

			// Act
			const harness = await create();

			// Assert
			expect(await harness.hintText()).toContain(expected);
		});
	});

	describe('the new alert field at start', () => {
		it.each([
			{
				name: 'starts with it when asked and the project has alerts',
				inputs: { startWithNewAlert: true },
				expected: true,
			},
			{
				name: 'does not start with it when an alert is already given',
				inputs: { startWithNewAlert: true, initialAlert: ALERT_DTO },
				expected: false,
			},
		])('$name', async ({ inputs, expected }) => {
			// Arrange
			const harness = await create(inputs);

			// Act
			const shown = (await harness.newAlertField()) !== null;

			// Assert
			expect(shown).toBe(expected);
		});
	});
});
