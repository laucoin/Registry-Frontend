import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoService } from '@jsverse/transloco';
import { Observable, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { MetadataApi } from '@core/registry/state/metadata.api';
import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { VehicleApi } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.api';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehicleStore } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.store';
import { MovementApi } from '@pages/projects/[projectId]/movements/data/state/movement.api';
import { ERROR_500, ERROR_503, failing, pageOf, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { ErrorModel } from '@shared/models/model/error.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

describe('VehicleFacade', () => {
	let facade: VehicleFacade;
	let findVehicles: Mock<VehicleApi['findVehicles']>;
	let createVehicle: Mock<VehicleApi['createVehicle']>;
	let restoreVehicleById: Mock<VehicleApi['restoreVehicleById']>;
	let api: Record<string, Mock>;
	let notify: Mock<(message: unknown) => void>;

	beforeEach(() => {
		provideTestConfig();
		findVehicles = vi.fn(() => of(pageOf<VehicleModel>([], 2)));
		createVehicle = vi.fn();
		restoreVehicleById = vi.fn();
		api = {
			findVehicleTimeline: vi.fn(() => of({ planned: [], actual: [], outSeconds: 0, usageRate: undefined })),
			findVehicleById: vi.fn(),
			updateVehicleById: vi.fn(),
			softDeleteVehicleById: vi.fn(),
			hardDeleteVehicleById: vi.fn(),
		};
		notify = vi.fn();
		TestBed.configureTestingModule({
			providers: [
				VehicleFacade,
				VehicleStore,
				{ provide: VehicleApi, useValue: { findVehicles, createVehicle, restoreVehicleById, ...api } },
				{ provide: MovementApi, useValue: { findMovementsContents: vi.fn(() => of([])) } },
				{ provide: MetadataApi, useValue: { getPresencesStatus: vi.fn(() => of([])) } },
				{ provide: SessionFacade, useValue: { currentProjectId: signal('p1') } },
				{ provide: UiFacade, useValue: { notify } },
				{
					provide: TranslocoService,
					useValue: {
						translate: (key: string): string => `t:${key}`,
						langChanges$: new Subject<string>().asObservable(),
					},
				},
			],
		});
		facade = TestBed.inject(VehicleFacade);
		facade.fetchVehiclesPage(2, 10);
		findVehicles.mockClear();
	});

	it('fetches the requested page for the selected project', () => {
		// Arrange
		const page = 3;

		// Act
		facade.fetchVehiclesPage(page, 10);

		// Assert
		expect(findVehicles).toHaveBeenCalledWith('p1', 3, 10, expect.anything());
	});

	it('restarts from the first page when the search changed', () => {
		// Arrange
		facade.inputPageSearchParameters('van', undefined, undefined, undefined);

		// Act
		facade.fetchVehiclesPage(4, 10);

		// Assert
		expect(findVehicles).toHaveBeenCalledWith('p1', 0, 10, expect.anything());
	});

	it('translates the visibility labels except the empty option', () => {
		// Arrange
		const expected: (string | undefined)[] = ['-', 't:vehicles.visible.true', 't:vehicles.visible.false'];

		// Act
		const labels = facade.visibilitiesMetadata().map((item: { label?: string }) => item.label);

		// Assert
		expect(labels).toEqual(expected);
	});

	it('notifies with the vehicle identity and refreshes the page after a creation', () => {
		// Arrange
		createVehicle.mockReturnValue(of({ id: 'v1', licensePlate: 'AB-123' } as VehicleModel));

		// Act
		facade.createVehicle({} as never).subscribe();

		// Assert
		expect(notify).toHaveBeenCalledWith(
			expect.objectContaining({
				summary: 'vehicles.notifications.create.title',
				data: expect.objectContaining({ registration: 'AB-123' }),
			}),
		);
		expect(findVehicles).toHaveBeenCalledWith('p1', 0, 30, expect.anything());
	});

	it('lets the form handle a creation error other than 503', () => {
		// Arrange
		createVehicle.mockReturnValue(failing(ERROR_500));
		let received: ErrorModel | undefined;

		// Act
		facade.createVehicle({} as never).subscribe({
			error: (error: ErrorModel) => {
				received = error;
			},
		});

		// Assert
		expect(received).toBe(ERROR_500);
		expect(notify).not.toHaveBeenCalled();
	});

	it('rethrows a 503 on creation for the form to display', () => {
		// Arrange
		createVehicle.mockReturnValue(failing(ERROR_503));
		let received: unknown;

		// Act
		facade.createVehicle({} as never).subscribe({
			error: (error: unknown) => {
				received = error;
			},
		});

		// Assert
		expect(received).toBe(ERROR_503);
	});

	it('notifies a failed enable instead of rethrowing it', () => {
		// Arrange
		restoreVehicleById.mockReturnValue(failing(ERROR_500));
		let completed = false;

		// Act
		facade.restoreVehicle('v1').subscribe({
			complete: () => {
				completed = true;
			},
		});

		// Assert
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Title' }));
		expect(completed).toBe(true);
	});

	it('reloads every shown batch of the movements of a vehicle in one request', () => {
		// Arrange
		const finder: Mock = vi.fn(() => of(pageOf<never>([], 1)));
		(TestBed.inject(VehicleApi) as unknown as Record<string, Mock>)['findVehicleMovements'] = finder;
		facade.fetchVehicleMovementsPage('e1', 1, 10);
		finder.mockClear();

		// Act
		facade.reloadVehicleMovementsPage('e1');

		// Assert
		expect(finder).toHaveBeenCalledWith('p1', 'e1', 0, expect.any(Number), expect.anything());
	});

	it('fetches a vehicle of the selected project', () => {
		// Arrange
		api['findVehicleById'].mockReturnValue(of({ id: 'v1' } as VehicleModel));
		let received: VehicleModel | undefined;

		// Act
		facade.fetchVehicle('v1').subscribe((it) => {
			received = it;
		});

		// Assert
		expect(api['findVehicleById']).toHaveBeenCalledWith('p1', 'v1');
		expect(received?.id).toBe('v1');
	});

	it('notifies a failed vehicle fetch', () => {
		// Arrange
		api['findVehicleById'].mockReturnValue(failing(ERROR_500));

		// Act
		facade.fetchVehicle('v1').subscribe({ error: (): void => undefined });

		// Assert
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Title' }));
	});

	it('sends the version of the vehicle on update and announces the edition', () => {
		// Arrange
		api['updateVehicleById'].mockReturnValue(of({ id: 'v1', licensePlate: 'AB-123' } as VehicleModel));

		// Act
		facade.updateVehicle('v1', {} as never, 'etag-1').subscribe();

		// Assert
		expect(api['updateVehicleById']).toHaveBeenCalledWith('p1', 'v1', {}, 'etag-1');
		expect(notify).toHaveBeenCalledWith(expect.objectContaining({ summary: 'vehicles.notifications.edit.title' }));
		expect(findVehicles).toHaveBeenCalledTimes(1);
	});

	it.each(['softDelete', 'hardDelete'] as const)(
		'notifies and refreshes the page after the vehicle is %sd',
		(command) => {
			// Arrange
			const vehicle = { id: 'v1', licensePlate: 'AB-123' } as VehicleModel;
			api['softDeleteVehicleById'].mockReturnValue(of(vehicle));
			api['hardDeleteVehicleById'].mockReturnValue(of(undefined));

			// Act
			const run$: Observable<unknown> =
				command === 'softDelete' ? facade.softDeleteVehicle('v1') : facade.hardDeleteVehicle(vehicle);
			run$.subscribe();

			// Assert
			expect(notify).toHaveBeenCalledWith(
				expect.objectContaining({ summary: `vehicles.notifications.${command}.title` }),
			);
			expect(findVehicles).toHaveBeenCalledTimes(1);
		},
	);

	it('does not refresh the page when a deletion fails', () => {
		// Arrange
		api['hardDeleteVehicleById'].mockReturnValue(failing(ERROR_500));

		// Act
		facade.hardDeleteVehicle({ id: 'v1' } as VehicleModel).subscribe({ error: (): void => undefined });

		// Assert
		expect(findVehicles).not.toHaveBeenCalled();
	});

	it('restarts the movements from the first page when their search changed', () => {
		// Arrange
		const finder: Mock = vi.fn(() => of(pageOf<never>([], 1)));
		(TestBed.inject(VehicleApi) as unknown as Record<string, Mock>)['findVehicleMovements'] = finder;
		facade.inputMovementsPageSearchParameters('IN', new Date('2026-01-01T00:00:00.000Z'), undefined, true);

		// Act
		facade.fetchVehicleMovementsPage('v1', 4, 10);

		// Assert
		expect(finder).toHaveBeenCalledWith('p1', 'v1', 0, 10, expect.anything());
		expect(facade.vehicleMovementsPageTypeParam()).toBe('IN');
		expect(facade.vehicleMovementsPageFromParam()?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
	});

	it('keeps the movements search when the same values are input again', () => {
		// Arrange
		facade.inputMovementsPageSearchParameters('IN', undefined, undefined, undefined);

		// Act
		facade.inputMovementsPageSearchParameters('IN', undefined, undefined, undefined);

		// Assert
		expect(facade.vehicleMovementsPageTypeParam()).toBe('IN');
	});

	it('loads the timeline of a vehicle for the selected project and exposes it as signals', () => {
		// Arrange

		// Act
		facade.fetchVehicleTimeline('v1');

		// Assert
		expect(api['findVehicleTimeline']).toHaveBeenCalledWith('p1', 'v1');
		expect(facade.vehicleTimeline()?.outSeconds).toBe(0);
		expect(facade.vehicleTimelineLoading()).toBe(false);
		expect(facade.vehicleTimelineError()).toBeUndefined();
	});

	it('reloads the timeline of a vehicle', () => {
		// Arrange
		facade.fetchVehicleTimeline('v1');

		// Act
		facade.reloadVehicleTimeline('v1');

		// Assert
		expect(api['findVehicleTimeline']).toHaveBeenCalledTimes(2);
	});

	it('exposes the failure of the timeline without touching the movements', () => {
		// Arrange
		api['findVehicleTimeline'].mockReturnValue(failing(ERROR_503));

		// Act
		facade.fetchVehicleTimeline('v1');

		// Assert
		expect(facade.vehicleTimelineError()?.summary).toBe('Down');
		expect(facade.vehicleMovementsPageError()).toBeUndefined();
	});

	it('exposes the dates of the movements search as dates', () => {
		// Arrange
		const from = new Date('2026-01-01T00:00:00.000Z');
		const to = new Date('2026-01-02T00:00:00.000Z');

		// Act
		facade.inputMovementsPageSearchParameters(undefined, from, to, undefined);

		// Assert
		expect([facade.vehicleMovementsPageFromParam(), facade.vehicleMovementsPageToParam()]).toEqual([from, to]);
	});

	it('keeps the requested page when the same search is input again', () => {
		// Arrange
		facade.inputPageSearchParameters('van', undefined, undefined, undefined);
		facade.fetchVehiclesPage(0, 10);
		facade.inputPageSearchParameters('van', undefined, undefined, undefined);

		// Act
		facade.fetchVehiclesPage(3, 10);

		// Assert
		expect(findVehicles.mock.calls.at(-1)?.[1]).toBe(3);
	});

	it('notifies and refreshes the page after a vehicle is enabled', () => {
		// Arrange
		restoreVehicleById.mockReturnValue(
			of({ id: 'v1', licensePlate: 'AB', brand: 'R', model: 'T' } as VehicleModel),
		);

		// Act
		facade.restoreVehicle('v1').subscribe();

		// Assert
		expect([notify.mock.calls.length, findVehicles.mock.calls.length]).toEqual([1, 1]);
	});

	it('exposes the date of the search as a date', () => {
		// Arrange
		const at = new Date('2026-01-01T10:00:00.000Z');

		// Act
		facade.inputPageSearchParameters(undefined, at, undefined, undefined);

		// Assert
		expect(facade.vehiclesPageAtParam()).toEqual(at);
	});
});
