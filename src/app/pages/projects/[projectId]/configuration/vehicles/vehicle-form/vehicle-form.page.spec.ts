import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe, Location } from '@angular/common';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import {
	VehicleFormHarness,
	VehicleTextFieldEnum,
} from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/testing/vehicle-form.harness';
import { VehicleFormPage } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-form/vehicle-form.page';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { defined } from '@shared/helpers/testing/defined';
import { VEHICLE_DTO, WHEN_ETAG } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, failing, provideTestConfig } from '@shared/helpers/testing/test-fixtures';
import { VehicleMapper } from '@shared/mappers/vehicle.mapper';

const ELEMENT = VehicleMapper.toModel(VEHICLE_DTO);

describe('VehicleFormPage', () => {
	let facade: Record<string, Mock>;
	let navigate: Mock;

	async function create(id?: string): Promise<VehicleFormHarness> {
		TestBed.overrideProvider(ActivatedRoute, {
			useValue: { snapshot: { params: id ? { vehicleId: id } : {}, url: id ? [{}, {}] : [{}] } },
		});
		return TestbedHarnessEnvironment.harnessForFixture(
			TestBed.createComponent(VehicleFormPage),
			VehicleFormHarness,
		);
	}

	beforeEach(() => {
		provideTestConfig();
		navigate = vi.fn(() => Promise.resolve(true));
		facade = {
			fetchVehicle: vi.fn(() => of(ELEMENT)),
			createVehicle: vi.fn(() => of(ELEMENT)),
			updateVehicle: vi.fn(() => of(ELEMENT)),
		};
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: VehicleFacade, useValue: facade },
				{ provide: Location, useValue: { back: vi.fn() } },
				{ provide: Router, useValue: { navigate, navigateByUrl: vi.fn(() => Promise.resolve(true)) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { params: {}, url: [{}] } } },
				{
					provide: SessionFacade,
					useValue: { selectedProject: signal(undefined), currentUser: signal(undefined) },
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), notify: vi.fn() } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	it('does not save an empty form', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect(facade['createVehicle']).not.toHaveBeenCalled();
	});

	it('creates the element from the typed values and closes on the list', async () => {
		// Arrange
		const harness = await create();
		await harness.type(VehicleTextFieldEnum.LICENSE_PLATE, 'XY-987');
		await harness.type(VehicleTextFieldEnum.BRAND, 'Renault');
		await harness.type(VehicleTextFieldEnum.MODEL, 'Trafic');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([facade['createVehicle'].mock.calls[0], navigate.mock.calls[0][0]]).toEqual([
			[expect.objectContaining({ licensePlate: 'XY-987', brand: 'Renault', model: 'Trafic' })],
			['..'],
		]);
	});

	it('loads the edited element, fills the form and updates it with its version', async () => {
		// Arrange
		const harness = await create('e1');
		const filled = await harness.text(VehicleTextFieldEnum.LICENSE_PLATE);

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([filled, facade['updateVehicle'].mock.calls[0], navigate.mock.calls[0][0]]).toEqual([
			ELEMENT.licensePlate,
			['v1', expect.objectContaining({ licensePlate: 'AB-123' }), WHEN_ETAG],
			['../..'],
		]);
	});

	it('shows the error of a failed save and stays on the form', async () => {
		// Arrange
		facade['updateVehicle'].mockReturnValue(failing(ERROR_500));
		const harness = await create('e1');

		// Act
		await (await harness.dialog()).submit();

		// Assert
		expect([await defined(await (await harness.dialog()).error()).title(), navigate.mock.calls]).toEqual([
			'fr.Title',
			[],
		]);
	});

	it('closes on the list when it is cancelled', async () => {
		// Arrange
		const harness = await create();

		// Act
		await (await harness.dialog()).cancel();

		// Assert
		expect(navigate.mock.calls[0][0]).toEqual(['..']);
	});
});
