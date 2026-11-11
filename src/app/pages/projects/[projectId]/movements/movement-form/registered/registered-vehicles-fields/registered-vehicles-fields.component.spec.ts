import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	createRegisteredMovementForm,
	emptyRegisteredMovementFormModel,
	MovementVehicleModel,
} from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement.form';
import { RegisteredVehiclesFieldsComponent } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-vehicles-fields/registered-vehicles-fields.component';
import { RegisteredVehiclesFieldsHarness } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-vehicles-fields/testing/registered-vehicles-fields.harness';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { VehicleModel } from '@shared/models/model/vehicle.model';

const vehicle = (id: string, status: PresenceStatusEnum): VehicleModel =>
	({
		id,
		brand: 'Renault',
		model: 'Trafic',
		licensePlate: id.toUpperCase(),
		status: { value: status, label: status },
	}) as VehicleModel;

const ADA = { id: 'ada', firstName: 'Ada', lastName: 'Doe', major: true } as ParticipantModel;

@Component({
	imports: [RegisteredVehiclesFieldsComponent],
	templateUrl: './registered-vehicles-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(emptyRegisteredMovementFormModel(new Date(2026, 0, 1)));
	public readonly form = createRegisteredMovementForm(this.model, {
		project: signal(undefined),
		formatDate: (): string => '',
		editing: (): boolean => false,
	});
	public readonly drivers = [{ label: 'Ada Doe', value: ADA }];
	public readonly presence = [PresenceStatusEnum.IN];
}

describe('RegisteredVehiclesFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let search: Mock<(query: string) => void>;

	async function create(vehicles: MovementVehicleModel[] = []): Promise<RegisteredVehiclesFieldsHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.model.update((model) => ({ ...model, vehicles }));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, RegisteredVehiclesFieldsHarness);
	}

	beforeEach(() => {
		search = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { movements: { form: { warning: { vehicle: { IN: 'Already in' } } } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: MovementFacade,
					useValue: {
						searchedVehicleMetadata: signal([
							{ label: 'v1', value: vehicle('v1', PresenceStatusEnum.OUT) },
							{ label: 'v2', value: vehicle('v2', PresenceStatusEnum.IN) },
						]),
						searchVehicles: search,
					},
				},
			],
		});
	});

	it('says when no vehicle is chosen and offers the searched ones', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.emptyShown(), await harness.options()];

		// Assert
		expect(shown).toEqual([true, ['Renault Trafic (V1)', 'Renault Trafic (V2)']]);
	});

	it('searches the vehicles when opened and when typed', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.open();
		await harness.search('traf');

		// Assert
		expect(search.mock.calls).toEqual([[''], ['traf']]);
	});

	it('adds the chosen vehicle waiting for a driver, warns about its status and clears the search', async () => {
		// Arrange
		const harness = await create();

		// Act
		const cleared = await harness.choose('v2');

		// Assert
		expect([cleared, await harness.vehicles()]).toEqual([
			'',
			[{ label: 'Renault Trafic (V2)', warning: 'Already in', driver: '', drivers: ['Ada Doe'] }],
		]);
	});

	it('adds nothing for an unknown vehicle', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.choose('v9');

		// Assert
		expect(fixture.componentInstance.model().vehicles).toEqual([]);
	});

	it.each([
		{ name: 'sets the chosen driver of a vehicle and leaves the others', id: 'ada', expected: ADA },
		{ name: 'clears the driver for an unknown choice', id: 'zoe', expected: null },
	])('$name', async ({ id, expected }) => {
		// Arrange
		const harness = await create([
			{ vehicle: vehicle('v1', PresenceStatusEnum.OUT), driver: null },
			{ vehicle: vehicle('v2', PresenceStatusEnum.OUT), driver: null },
		]);

		// Act
		await harness.chooseDriver(1, id);

		// Assert
		expect(fixture.componentInstance.model().vehicles.map((item) => item.driver)).toEqual([null, expected]);
	});

	it('removes the chosen vehicle and keeps the others', async () => {
		// Arrange
		const kept = { vehicle: vehicle('v1', PresenceStatusEnum.OUT), driver: ADA };
		const harness = await create([kept, { vehicle: vehicle('v2', PresenceStatusEnum.IN), driver: null }]);

		// Act
		await harness.remove(1);

		// Assert
		expect(fixture.componentInstance.model().vehicles).toEqual([kept]);
	});
});
