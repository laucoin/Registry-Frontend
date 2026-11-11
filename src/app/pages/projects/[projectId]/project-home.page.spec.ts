import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { NEVER, Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { ProjectHomePage } from '@pages/projects/[projectId]/project-home.page';
import { ProjectHomeHarness } from '@pages/projects/[projectId]/testing/project-home.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { ProjectOptionEnum } from '@shared/models/enumeration/project-option.enum';
import { CurrentUserModel } from '@shared/models/model/current-user.model';
import { ProjectModel } from '@shared/models/model/project.model';

@Component({ template: '' })
class EmptyComponent {}

const PROJECT_ID = 'p1';

/** Facade dont chaque membre est lu comme un signal vide ou appelé comme une commande sans effet. */
function silentFacade(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	const members: Record<string, unknown> = { ...overrides };
	return new Proxy(members, {
		get: (_, key: string | symbol): unknown => {
			if (typeof key !== 'string' || key === 'then') return undefined;
			return (members[key] ??= vi.fn(() => undefined));
		},
	});
}

describe('ProjectHomePage', () => {
	let fixture: ComponentFixture<ProjectHomePage>;
	let authorities: WritableSignal<string[]>;
	let options: WritableSignal<ProjectOptionEnum[]>;
	let role: WritableSignal<string | undefined>;
	let toggleSelectedProjectFavorite: Mock<() => void>;

	function create(): Promise<ProjectHomeHarness> {
		fixture = TestBed.createComponent(ProjectHomePage);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectHomeHarness);
	}

	beforeEach(() => {
		authorities = signal<string[]>([]);
		options = signal<ProjectOptionEnum[]>([]);
		role = signal<string | undefined>(undefined);
		toggleSelectedProjectFavorite = vi.fn();
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				public observe = vi.fn();
				public unobserve = vi.fn();
				public disconnect = vi.fn();
			},
		);
		TestBed.configureTestingModule({
			deferBlockBehavior: DeferBlockBehavior.Manual,
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				REFRESH_SERVICE_STUB,
				PluralTranslationPipe,
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn(), confirm: vi.fn() } },
				{ provide: MovementPrefillService, useValue: silentFacade() },
				{ provide: SelectedProjectFacade, useValue: silentFacade() },
				{
					provide: AlertFacade,
					useValue: silentFacade({ handleAlertCreation: (): Observable<never> => NEVER }),
				},
				{
					provide: CommunicationFacade,
					useValue: silentFacade({
						communication$: NEVER,
						metadataErrors: signal({}),
						searchedMovementsMetadata: signal([]),
						searchedAlertsMetadata: signal([]),
						handleCommunicationFirstPageReload: (): Observable<never> => NEVER,
						handleCommunicationCurrentPageReload: (): Observable<never> => NEVER,
					}),
				},
				{
					provide: SessionFacade,
					useValue: {
						selectedProject: (): ProjectModel =>
							({
								id: PROJECT_ID,
								name: 'Camp',
								favorite: true,
								options: options().map((value) => ({ value, label: value })),
								profile: role() ? { role: { value: role() } } : undefined,
							}) as unknown as ProjectModel,
						selectedProjectHasOption:
							(option: ProjectOptionEnum): (() => boolean) =>
							(): boolean =>
								options().includes(option),
						currentUser: (): CurrentUserModel =>
							({ id: 'u1', authorities: authorities() }) as unknown as CurrentUserModel,
						currentProjectId: signal(PROJECT_ID),
						toggleSelectedProjectFavorite,
					},
				},
			],
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('titles the page after the selected project and toggles its favorite', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.favorite()).toggle();

		// Assert
		expect([await harness.title(), toggleSelectedProjectFavorite.mock.calls.length]).toEqual(['Camp', 1]);
	});

	it.each([
		{
			name: 'only the participants overview to a member without rights nor options',
			authorities: [],
			options: [],
			role: 'PROJECT_PARTICIPANT',
			widgets: ['app-project-participant-overview'],
			links: [],
			alert: false,
		},
		{
			name: 'the planned movements and the movement forms to who creates movements',
			authorities: [`${PROJECT_ID}_REGISTRY_PROJECT_MOVEMENT_C`],
			options: [],
			role: undefined,
			widgets: [
				'app-project-participant-overview',
				'app-project-upcoming-arrival',
				'app-project-upcoming-departure',
			],
			links: [
				`/projects/${PROJECT_ID}/movements/create/registered`,
				`/projects/${PROJECT_ID}/movements/create/guest`,
			],
			alert: false,
		},
		{
			name: 'the vehicles, the alerts and the alert creation with their options and rights',
			authorities: [`${PROJECT_ID}_REGISTRY_PROJECT_ALERT_C`],
			options: [ProjectOptionEnum.VEHICLE, ProjectOptionEnum.ALERT],
			role: undefined,
			widgets: ['app-project-participant-overview', 'app-project-vehicle-overview', 'app-project-active-alert'],
			links: [],
			alert: true,
		},
		{
			name: 'the regularizations and the birthdays to an administrator of the project',
			authorities: [],
			options: [],
			role: 'PROJECT_ADMINISTRATOR',
			widgets: [
				'app-project-participant-overview',
				'app-project-participant-regularization',
				'app-project-birthday',
			],
			links: [],
			alert: false,
		},
		{
			name: 'the regularizations and the birthdays to a coordinator of the project',
			authorities: [],
			options: [ProjectOptionEnum.VEHICLE],
			role: 'PROJECT_COORDINATOR',
			widgets: [
				'app-project-participant-overview',
				'app-project-vehicle-overview',
				'app-project-participant-regularization',
				'app-project-birthday',
			],
			links: [],
			alert: false,
		},
	])('shows $name', async ({ authorities: granted, options: enabled, role: profile, widgets, links, alert }) => {
		// Arrange
		authorities.set(granted);
		options.set(enabled);
		role.set(profile);

		// Act
		const harness = await create();

		// Assert
		expect([await harness.widgets(), await harness.movementLinks(), await harness.canCreateAlert()]).toEqual([
			widgets,
			links,
			alert,
		]);
	});

	it('opens the alert creation in a drawer and closes it when the drawer hides itself', async () => {
		// Arrange
		authorities.set([`${PROJECT_ID}_REGISTRY_PROJECT_ALERT_C`]);
		options.set([ProjectOptionEnum.ALERT]);
		const harness = await create();
		await harness.openAlertCreation();
		const opened = await harness.alertCreationShown();

		// Act
		await harness.hideAlertDrawer();

		// Assert
		expect([opened, await harness.alertCreationShown()]).toEqual([true, false]);
	});

	it('keeps the alert drawer open when an element inside it hides its own panel', async () => {
		// Arrange
		authorities.set([`${PROJECT_ID}_REGISTRY_PROJECT_ALERT_C`]);
		options.set([ProjectOptionEnum.ALERT]);
		const harness = await create();
		await harness.openAlertCreation();
		const inner: HTMLElement = fixture.nativeElement.querySelector('[data-test-id="project-home-alert-form"]');

		// Act
		inner.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

		// Assert
		expect(await harness.alertCreationShown()).toBe(true);
	});

	it.each([
		{
			name: 'the operational monitoring once loaded',
			state: DeferBlockState.Complete,
			selector: 'app-project-operational-monitoring',
		},
		{ name: 'a skeleton while the monitoring loads', state: DeferBlockState.Loading, selector: 'sgdf-skeleton' },
		{
			name: 'the generic failure when the monitoring cannot load',
			state: DeferBlockState.Error,
			selector: '[data-test-id="project-home-monitoring-error"]',
		},
	])('shows $name', async ({ state, selector }) => {
		// Arrange
		await create();
		const [monitoring] = await fixture.getDeferBlocks();

		// Act
		await monitoring.render(state);

		// Assert
		expect(fixture.nativeElement.querySelector(`section ${selector}`)).not.toBeNull();
	});
});
