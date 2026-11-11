import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { NEVER, Observable } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
import { CommunicationFacade } from '@pages/projects/[projectId]/movements/communication/data/state/communication.facade';
import { ProjectActiveAlertComponent } from '@pages/projects/[projectId]/widgets/project-active-alert/project-active-alert.component';
import { ProjectActiveAlertHarness } from '@pages/projects/[projectId]/widgets/project-active-alert/testing/project-active-alert.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { DateFormatPipe } from '@shared/helpers/pipe/date-format.pipe';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { AlertModel } from '@shared/models/model/alert.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';

const TRANSLATIONS = {
	projectHome: {
		activeAlert: {
			title: 'Open alerts',
			empty: 'None',
			seeAll: 'See all',
			total: { one: '{{ count }} open', few: '{{ count }} open' },
			seeRemaining: { one: 'See {{ count }} more', few: 'See {{ count }} more' },
		},
	},
};

const alert = (id: string, criticality: string | undefined): AlertModel =>
	({
		id,
		visible: true,
		title: `Alert ${id}`,
		dateTime: new Date('2026-01-01T10:00:00Z'),
		status: { label: 'Open', value: 'IN_PROGRESS' },
		criticality: criticality ? { label: criticality, value: criticality } : undefined,
		lastCommunication: undefined,
	}) as unknown as AlertModel;

const pageOf = (content: AlertModel[], totalElements = content.length): PageModel<AlertModel> => ({
	content,
	page: 0,
	size: 3,
	totalElements,
	totalPages: 1,
	hasNext: false,
	lastRefresh: new Date(),
});

describe('ProjectActiveAlertComponent', () => {
	let fixture: ComponentFixture<ProjectActiveAlertComponent>;
	let page: WritableSignal<PageModel<AlertModel> | undefined>;
	let loading: WritableSignal<boolean>;
	let error: WritableSignal<NotificationModel | undefined>;
	let rule: WritableSignal<string | undefined>;
	let communication: WritableSignal<boolean>;
	let fetch: Mock<(page: number, size: number) => void>;
	let refresh: Mock<() => void>;
	let reloads: (() => void)[];

	function create(): Promise<ProjectActiveAlertHarness> {
		fixture = TestBed.createComponent(ProjectActiveAlertComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ProjectActiveAlertHarness);
	}

	beforeEach(() => {
		page = signal<PageModel<AlertModel> | undefined>(undefined);
		loading = signal(false);
		error = signal<NotificationModel | undefined>(undefined);
		rule = signal<string | undefined>('Aging rule');
		communication = signal(true);
		fetch = vi.fn();
		refresh = vi.fn();
		reloads = [];
		vi.stubGlobal(
			'IntersectionObserver',
			class {
				public observe = vi.fn();
				public disconnect = vi.fn();
			},
		);
		Element.prototype.scrollIntoView = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: TRANSLATIONS },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([]),
				PluralTranslationPipe,
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: DateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn(), confirm: vi.fn() } },
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
					},
				},
				{
					provide: SelectedProjectFacade,
					useValue: {
						currentAlertsPage: page,
						currentAlertsPageLoading: loading,
						currentAlertsPageError: error,
						fetchCurrentAlertsPage: fetch,
						refreshCurrentAlertsPage: refresh,
					},
				},
				{
					provide: AlertFacade,
					useValue: {
						alertCriticalityRule: rule,
						alertCommunicationsPage: signal(undefined),
						alertCommunicationsPageLoading: signal(false),
						alertCommunicationsPageSilentLoading: signal(false),
						fetchAlertCommunicationsPage: vi.fn(),
						handleAlertCreation: (): Observable<never> => NEVER,
					},
				},
				{
					provide: CommunicationFacade,
					useValue: {
						communication: signal(undefined),
						communication$: NEVER,
						communicationError: signal(undefined),
						communicationLoading: signal(false),
						metadataErrors: signal({}),
						searchedMovementsMetadata: signal([]),
						searchedAlertsMetadata: signal([]),
						handleCommunicationFirstPageReload: (): Observable<never> => NEVER,
						handleCommunicationCurrentPageReload: (): Observable<never> => NEVER,
						resetCommunication: vi.fn(),
						fetchCommunication: vi.fn(),
					},
				},
				{
					provide: SessionFacade,
					useValue: {
						currentUser: signal({ id: 'u1', authorities: [] }),
						selectedProject: signal({ id: 'p1', options: [] }),
						selectedProjectHasOption: (): WritableSignal<boolean> => communication,
						currentProjectId: signal('p1'),
					},
				},
			],
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('loads the first open alerts and shows the loading state until they arrive', async () => {
		// Arrange
		loading.set(true);

		// Act
		const harness = await create();

		// Assert
		expect([await harness.title(), await harness.loadingShown(), await harness.total(), fetch.mock.calls]).toEqual([
			'Open alerts',
			true,
			undefined,
			[[0, 6]],
		]);
	});

	it.each([
		{ name: 'the rule of the criticality', value: 'Aging rule', expected: 'Aging rule' },
		{ name: 'no rule when the backend sends none', value: undefined, expected: undefined },
	])('shows $name', async ({ value, expected }) => {
		// Arrange
		rule.set(value);

		// Act
		const harness = await create();

		// Assert
		expect(await harness.rule()).toBe(expected);
	});

	it('says there is no open alert', async () => {
		// Arrange
		page.set(pageOf([]));

		// Act
		const harness = await create();

		// Assert
		expect([await harness.empty(), await harness.total(), (await harness.link()).text]).toEqual([
			'None',
			'0 open',
			'See all',
		]);
	});

	it('colors each alert by its criticality and offers the alerts not shown', async () => {
		// Arrange
		page.set(
			pageOf([alert('a1', 'HIGH'), alert('a2', 'REINFORCED'), alert('a3', 'RECENT'), alert('a4', undefined)], 6),
		);
		const harness = await create();

		// Act
		const variants = await Promise.all((await harness.cards()).map(async (card) => (await card.view()).variant));

		// Assert
		expect([variants, await harness.link()]).toEqual([
			['danger', 'warning', 'info', 'info'],
			{ text: 'See 2 more', href: '/projects/p1/alerts' },
		]);
	});

	it('opens the communications of an alert in a drawer and closes it when the drawer hides itself', async () => {
		// Arrange
		page.set(pageOf([alert('a1', 'URGENT')]));
		const harness = await create();
		await (await harness.cards())[0].communicate();
		const opened = [await harness.drawerTitle(), await harness.communicationShown()];

		// Act
		await harness.hideDrawer();

		// Assert
		expect([opened, await harness.communicationShown()]).toEqual([['Alert a1', true], false]);
	});

	it('keeps the drawer open when an element inside it hides its own panel', async () => {
		// Arrange
		page.set(pageOf([alert('a1', 'URGENT')]));
		const harness = await create();
		await (await harness.cards())[0].communicate();
		const inner: HTMLElement = fixture.nativeElement.querySelector('[data-test-id="project-active-alert-form"]');

		// Act
		inner.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

		// Assert
		expect(await harness.communicationShown()).toBe(true);
	});

	it('shows the failure and loads again on retry', async () => {
		// Arrange
		error.set(PageStateHelper.toNotification(ERROR_500));
		const harness = await create();

		// Act
		await (await harness.error())?.retry();

		// Assert
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it('refreshes silently when the refresh service asks', async () => {
		// Arrange
		await create();

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect(refresh).toHaveBeenCalledTimes(1);
	});
});
