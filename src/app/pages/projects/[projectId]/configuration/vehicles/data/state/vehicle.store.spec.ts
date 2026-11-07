import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ErrorReporter } from '@core/registry/state/error-reporter';
import { MetadataApi } from '@core/registry/state/metadata.api';
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api';
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';
import { ERROR_500, ERROR_503, failing, pageOf } from '@shared/helpers/testing/test-fixtures';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';
import { VehicleTimelineModel } from '@shared/models/model/vehicle-timeline.model';

describe('VehicleStore', () => {
	let store: InstanceType<typeof VehicleStore>;
	let findVehicles: Mock<VehicleApi['findVehicles']>;
	let findVehicleMovements: Mock<VehicleApi['findVehicleMovements']>;
	let findVehicleTimeline: Mock<VehicleApi['findVehicleTimeline']>;
	let findMovementsContents: Mock<MovementApi['findMovementsContents']>;
	let getPresencesStatus: Mock<MetadataApi['getPresencesStatus']>;
	let langChanges: Subject<string>;

	beforeEach(() => {
		findVehicles = vi.fn();
		findVehicleMovements = vi.fn();
		findVehicleTimeline = vi.fn();
		findMovementsContents = vi.fn(() => of([]));
		getPresencesStatus = vi.fn(() => of([{ label: 'In', value: PresenceStatusEnum.IN }]));
		langChanges = new Subject<string>();
		TestBed.configureTestingModule({
			providers: [
				VehicleStore,
				{ provide: VehicleApi, useValue: { findVehicles, findVehicleMovements, findVehicleTimeline } },
				{ provide: MovementApi, useValue: { findMovementsContents } },
				{ provide: MetadataApi, useValue: { getPresencesStatus } },
				{ provide: ErrorReporter, useValue: { notify: vi.fn() } },
				{ provide: TranslocoService, useValue: { langChanges$: langChanges.asObservable() } },
			],
		});
		store = TestBed.inject(VehicleStore);
	});

	it('loads the presence statuses on init with an empty option first', () => {
		// Arrange
		const expectedFirst: unknown = { label: '-', value: undefined };

		// Act
		const statuses: unknown[] = store.metadata.presencesStatus();

		// Assert
		expect(statuses).toHaveLength(2);
		expect(statuses[0]).toEqual(expectedFirst);
	});

	it('reloads the presence statuses when the language changes but not on the initial language', () => {
		// Arrange
		langChanges.next('fr');
		const callsAfterInitial = getPresencesStatus.mock.calls.length;

		// Act
		langChanges.next('en');

		// Assert
		expect(callsAfterInitial).toBe(1);
		expect(getPresencesStatus).toHaveBeenCalledTimes(2);
	});

	it('appends the next batch to the vehicles already shown', () => {
		// Arrange
		findVehicles
			.mockReturnValueOnce(
				of({ ...pageOf<VehicleModel>([{ id: 'a1' } as VehicleModel]), size: 1, totalPages: 2 }),
			)
			.mockReturnValueOnce(
				of({ ...pageOf<VehicleModel>([{ id: 'a2' } as VehicleModel], 1), size: 1, totalPages: 2 }),
			);
		store.fetchVehiclesPage({ projectId: 'p1', page: 0, size: 1 });

		// Act
		store.fetchVehiclesPage({ projectId: 'p1', page: 1, size: 1 });

		// Assert
		expect(store.vehicles.element()?.content.map((element) => element.id)).toEqual(['a1', 'a2']);
	});

	it('stores the fetched vehicles page', () => {
		// Arrange
		findVehicles.mockReturnValue(of(pageOf<VehicleModel>([{ id: 'v1' } as VehicleModel])));

		// Act
		store.fetchVehiclesPage({ projectId: 'p1', page: 0, size: 10 });

		// Assert
		expect(store.vehicles.element()?.content).toHaveLength(1);
		expect(store.vehicles.loading()).toBe(false);
	});

	it('keeps a failed vehicles fetch in the vehicles block', () => {
		// Arrange
		findVehicles.mockReturnValue(failing(ERROR_500));

		// Act
		store.fetchVehiclesPage({ projectId: 'p1', page: 0, size: 10 });

		// Assert
		expect(store.vehicles.error()?.summary).toBe('Title');
	});

	it('keeps a 503 failure in its block', () => {
		// Arrange
		findVehicles.mockReturnValue(failing(ERROR_503));

		// Act
		store.fetchVehiclesPage({ projectId: 'p1', page: 0, size: 10 });

		// Assert
		expect(store.vehicles.error()).toBeDefined();
	});

	it('loads the movements of a vehicle and merges their contents', () => {
		// Arrange
		findVehicleMovements.mockReturnValue(of(pageOf<MovementModel>([{ id: 'm1' } as MovementModel])));
		findMovementsContents.mockReturnValue(
			of([{ first: 'm1', second: [{ id: 'c1' } as unknown as MovementContentModel] }]),
		);

		// Act
		store.fetchVehicleMovementsPage({ projectId: 'p1', id: 'v1', page: 0, size: 10 });

		// Assert
		expect(findMovementsContents).toHaveBeenCalledWith('p1', ['m1'], false);
		expect(store.movements.element()?.content[0].content).toHaveLength(1);
	});

	it('keeps a failed movements fetch in the movements block only', () => {
		// Arrange
		findVehicleMovements.mockReturnValue(failing(ERROR_500));

		// Act
		store.fetchVehicleMovementsPage({ projectId: 'p1', id: 'v1', page: 0, size: 10 });

		// Assert
		expect(store.movements.error()?.summary).toBe('Title');
		expect(store.vehicles.error()).toBeUndefined();
	});

	it('stores the timeline of a vehicle and ends its loading state', () => {
		// Arrange
		const timeline: VehicleTimelineModel = { planned: [], actual: [], outSeconds: 60, usageRate: 0.5 };
		findVehicleTimeline.mockReturnValue(of(timeline));

		// Act
		store.fetchVehicleTimeline({ projectId: 'p1', id: 'v1' });

		// Assert
		expect(findVehicleTimeline).toHaveBeenCalledWith('p1', 'v1');
		expect(store.timeline.element()).toEqual(timeline);
		expect(store.timeline.loading()).toBe(false);
	});

	it('keeps a failed timeline fetch in the timeline block only and still works afterwards', () => {
		// Arrange
		findVehicleTimeline.mockReturnValueOnce(failing(ERROR_500));
		store.fetchVehicleTimeline({ projectId: 'p1', id: 'v1' });
		const failure = store.timeline.error()?.summary;
		findVehicleTimeline.mockReturnValue(of({ planned: [], actual: [], outSeconds: 0, usageRate: undefined }));

		// Act
		store.fetchVehicleTimeline({ projectId: 'p1', id: 'v1' });

		// Assert
		expect(failure).toBe('Title');
		expect(store.movements.error()).toBeUndefined();
		expect(store.timeline.error()).toBeUndefined();
		expect(store.timeline.element()?.outSeconds).toBe(0);
	});

	it('reloads the timeline silently and keeps the previous one when it fails', () => {
		// Arrange
		findVehicleTimeline.mockReturnValueOnce(of({ planned: [], actual: [], outSeconds: 5, usageRate: undefined }));
		store.fetchVehicleTimeline({ projectId: 'p1', id: 'v1' });
		findVehicleTimeline.mockReturnValueOnce(failing(ERROR_500));

		// Act
		store.reloadVehicleTimeline({ projectId: 'p1', id: 'v1' });

		// Assert
		expect(store.timeline.element()?.outSeconds).toBe(5);
		expect(store.timeline.loading()).toBe(false);
		expect(store.timeline.error()).toBeUndefined();
	});
});
