import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ProjectOperationalMonitoringComponent } from '@pages/projects/[projectId]/widgets/project-operational-monitoring/project-operational-monitoring.component';
import { ProjectOperationalMonitoringHarness } from '@pages/projects/[projectId]/widgets/project-operational-monitoring/testing/project-operational-monitoring.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { RefreshService } from '@shared/helpers/refresh/refresh.service';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { MonitoringTabEnum } from '@shared/models/enumeration/monitoring-tab.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { PageModel } from '@shared/models/model/page.model';

const PAGE: PageModel<MovementModel> = {
	page: 0,
	size: 10,
	totalElements: 6,
	totalPages: 1,
	hasNext: true,
	content: [],
	lastRefresh: new Date(),
};

describe('ProjectOperationalMonitoringComponent', () => {
	let hasActivityOption: WritableSignal<boolean>;
	let withActivity: WritableSignal<PageModel<MovementModel> | undefined>;
	let facade: Record<string, unknown>;
	let reloads: (() => void)[];

	const calls = (name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	function create(): Promise<ProjectOperationalMonitoringHarness> {
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(ProjectOperationalMonitoringComponent),
			ProjectOperationalMonitoringHarness,
		);
	}

	beforeEach(() => {
		hasActivityOption = signal(true);
		withActivity = signal<PageModel<MovementModel> | undefined>(PAGE);
		reloads = [];
		facade = {
			currentMovementsPageWithActivity: withActivity,
			currentMovementsPageWithActivityLoading: signal(false),
			currentMovementsPageWithActivitySilentLoading: signal(false),
			currentMovementsPageWithActivityError: signal(undefined),
			fetchCurrentMovementsPageWithActivity: vi.fn(),
			refreshCurrentMovementsPageWithActivity: vi.fn(),
			currentMovementsPageWithoutActivity: signal(undefined),
			currentMovementsPageWithoutActivityLoading: signal(false),
			currentMovementsPageWithoutActivitySilentLoading: signal(false),
			currentMovementsPageWithoutActivityError: signal(undefined),
			fetchCurrentMovementsPageWithoutActivity: vi.fn(),
			refreshCurrentMovementsPageWithoutActivity: vi.fn(),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: SelectedProjectFacade, useValue: facade },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{
					provide: SessionFacade,
					useValue: { selectedProjectHasOption: (): WritableSignal<boolean> => hasActivityOption },
				},
				{
					provide: RefreshService,
					useValue: {
						register: (source: { reload: () => void }): (() => void) => {
							reloads.push(source.reload);
							return (): void => undefined;
						},
					},
				},
			],
		});
	});

	it('shows the activities and the other movements in two tabs, with the total of a loaded tab', async () => {
		// Arrange
		const harness = await create();

		// Act
		const tabs = await harness.tabs();

		// Assert
		expect([await harness.title(), tabs]).toEqual([
			'fr.projectHome.operationalMonitoring.title',
			[
				{ key: MonitoringTabEnum.ACTIVITIES, total: '6' },
				{ key: MonitoringTabEnum.OTHER_MOVEMENTS, total: undefined },
			],
		]);
	});

	it('loads the first ten movements of every tab at once', async () => {
		// Arrange
		await create();

		// Act
		const loaded = [
			calls('fetchCurrentMovementsPageWithActivity'),
			calls('fetchCurrentMovementsPageWithoutActivity'),
		];

		// Assert
		expect(loaded).toEqual([[[undefined, 10]], [[undefined, 10]]]);
	});

	it('shows the other movements as a single list without tab when the project has no activity option', async () => {
		// Arrange
		hasActivityOption.set(false);

		// Act
		const harness = await create();

		// Assert
		expect([
			await harness.title(),
			await harness.tabs(),
			(await harness.lists()).length,
			calls('fetchCurrentMovementsPageWithActivity'),
		]).toEqual(['fr.projectHome.operationalMonitoring.titleMovementsOnly', [], 1, []]);
	});

	it('loads the activities tab once the project gets the activity option', async () => {
		// Arrange
		hasActivityOption.set(false);
		const harness = await create();

		// Act
		hasActivityOption.set(true);
		const tabs = await harness.tabs();

		// Assert
		expect([tabs.length, calls('fetchCurrentMovementsPageWithActivity')]).toEqual([2, [[undefined, 10]]]);
	});

	it('asks for the next batch of the tab whose list retries after a failure', async () => {
		// Arrange
		(facade['currentMovementsPageWithActivityError'] as WritableSignal<unknown>).set(
			PageStateHelper.toNotification(ERROR_500),
		);
		const harness = await create();

		// Act
		await (await (await harness.list(MonitoringTabEnum.ACTIVITIES)).error())?.retry();

		// Assert
		expect(calls('fetchCurrentMovementsPageWithActivity').at(-1)).toEqual([1, 10]);
	});

	it('refreshes every tab silently when the refresh service asks', async () => {
		// Arrange
		await create();

		// Act
		reloads.forEach((reload) => reload());

		// Assert
		expect([
			calls('refreshCurrentMovementsPageWithActivity').length,
			calls('refreshCurrentMovementsPageWithoutActivity').length,
		]).toEqual([1, 1]);
	});
});
