import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { BehaviorSubject, NEVER, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehicleMovementsListPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-movements-list.page';
import { VehicleStatisticsHarness } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-movements-list/vehicle-statistics/testing/vehicle-statistics.harness';
import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { ElementMovementsListHarness } from '@pages/projects/[projectId]/movements/element-movements/testing/element-movements-list.harness';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { defined } from '@shared/helpers/testing/defined';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PresenceTimelineHarness } from '@shared/ui/common/presence-timeline/testing/presence-timeline.harness';

describe('VehicleMovementsListPage', () => {
	let facade: Record<string, Mock>;
	let detailsError: WritableSignal<NotificationModel | undefined>;
	let query: BehaviorSubject<ParamMap>;
	let firstPageReload: Subject<void>;
	let currentPageReload: Subject<void>;

	const calls = (name: string): unknown[][] => facade[name].mock.calls;

	async function create(): Promise<HarnessLoader> {
		return TestbedHarnessEnvironment.loader(TestBed.createComponent(VehicleMovementsListPage));
	}

	beforeEach(() => {
		detailsError = signal<NotificationModel | undefined>(undefined);
		query = new BehaviorSubject<ParamMap>(convertToParamMap({}));
		firstPageReload = new Subject<void>();
		currentPageReload = new Subject<void>();
		facade = Object.assign(autoMock(undefined), {
			vehicleMovementsPage: signal(undefined),
			vehicleMovementsPageError: signal(undefined),
			vehicleMovementsPageLoading: signal(false),
			vehicleMovementsPageSilentLoading: signal(false),
			vehicleMovementsPageTypeParam: signal('IN'),
			vehicleMovementsPageFromParam: signal(undefined),
			vehicleMovementsPageToParam: signal(undefined),
			vehicleMovementsPageIsVisibleParam: signal(undefined),
			vehicleTimeline: signal(undefined),
			vehicleTimelineLoading: signal(false),
			vehicleTimelineError: detailsError,
			fetchVehicle: vi.fn(() => of({ id: 'v1', licensePlate: 'AB-123' })),
		}) as unknown as Record<string, Mock>;
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { global: { list: { 'active-filters': '{{ count }}' } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						paramMap: of(convertToParamMap({ vehicleId: 'e1' })),
						queryParamMap: query,
						get snapshot(): object {
							return { params: { vehicleId: 'e1' }, queryParamMap: query.value, url: [] };
						},
					},
				},
				{
					provide: Router,
					useValue: { navigate: vi.fn(() => Promise.resolve(true)), url: '/', events: NEVER },
				},
				REFRESH_SERVICE_STUB,
				{ provide: VehicleFacade, useValue: facade },
				{
					provide: MovementFacade,
					useValue: {
						handleMovementFirstPageReload: (): Subject<void> => firstPageReload,
						handleMovementCurrentPageReload: (): Subject<void> => currentPageReload,
						movementTypesMetadata: signal([]),
						visibilitiesMetadata: signal([]),
					},
				},
				{
					provide: SessionFacade,
					useValue: { currentUser: signal({ authorities: [] }), selectedProject: signal({ id: 'p1' }) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
			],
		});
	});

	it('loads the element, its details and its movements, and titles the page after it', async () => {
		// Arrange
		const loader = await create();

		// Act
		const title = await (await loader.getHarness(ElementMovementsListHarness)).title();

		// Assert
		expect([
			title,
			calls('fetchVehicle'),
			calls('fetchVehicleTimeline'),
			calls('fetchVehicleMovementsPage'),
		]).toEqual(['AB-123', [['e1']], [['e1']], [['e1', undefined, undefined]]]);
	});

	it('sends the filters of the url to the facade and counts the applied ones', async () => {
		// Arrange
		query.next(convertToParamMap({ type: 'IN' }));
		const loader = await create();

		// Act
		const count = await (await (await loader.getHarness(ElementMovementsListHarness)).list()).activeFiltersText();

		// Assert
		expect([calls('inputMovementsPageSearchParameters')[0], count?.trim()]).toEqual([
			['IN', undefined, undefined, undefined, undefined],
			'1',
		]);
	});

	it('reloads the details with the movements after a command on a movement', async () => {
		// Arrange
		await create();

		// Act
		firstPageReload.next();
		currentPageReload.next();

		// Assert
		expect([calls('reloadVehicleTimeline'), calls('reloadVehicleMovementsPage')]).toEqual([
			[['e1'], ['e1']],
			[['e1']],
		]);
	});

	it('loads the details again when their failure is retried', async () => {
		// Arrange
		detailsError.set({ summary: 'Unavailable', detail: 'Try later' });
		const loader = await create();

		// Act
		await defined(await (await loader.getHarness(PresenceTimelineHarness)).error()).retry();

		// Assert
		expect(calls('fetchVehicleTimeline')).toEqual([['e1'], ['e1']]);
	});

	it('hides the statistics while the timeline shows its failure', async () => {
		// Arrange
		detailsError.set({ summary: 'Unavailable', detail: 'Try later' });
		const loader = await create();

		// Act
		const statistics = await loader.getHarnessOrNull(VehicleStatisticsHarness);

		// Assert
		expect(statistics).toBeNull();
	});
});
