import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { VehicleFacade } from '@pages/projects/[projectId]/configuration/vehicles/data/state/vehicle.facade';
import { VehicleRowHarness } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/testing/vehicle-row.harness';
import { VehicleRowComponent } from '@pages/projects/[projectId]/configuration/vehicles/vehicle-row/vehicle-row.component';
import { defined } from '@shared/helpers/testing/defined';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { VehicleModel } from '@shared/models/model/vehicle.model';

const VEHICLE = {
	id: 'v1',
	licensePlate: 'AB-123-CD',
	brand: 'Renault',
	model: 'Trafic',
	visible: true,
	status: { value: PresenceStatusEnum.IN, label: 'In' },
	startAvailability: undefined,
	endAvailability: { date: '2026-07-01', time: undefined },
} as unknown as VehicleModel;

@Component({
	imports: [VehicleRowComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './vehicle-row.component.spec.html',
})
class HostComponent {
	public readonly vehicle: WritableSignal<VehicleModel> = signal(VEHICLE);
}

describe('VehicleRowComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	async function create(vehicle: VehicleModel): Promise<VehicleRowHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.vehicle.set(vehicle);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(VehicleRowHarness);
	}

	beforeEach(() => {
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: VehicleFacade, useValue: {} },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ authorities: ['p1_REGISTRY_PROJECT_VEHICLE_HISTORY_R'] }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm: vi.fn(), tinyScreen: signal(false) } },
				{ provide: Router, useValue: { navigateByUrl, url: '/list' } },
				{ provide: DatePipe, useValue: { transform: (): string => '01/07' } },
			],
		});
	});

	it('titles a vehicle with its plate and describes its brand, model and availability', async () => {
		// Arrange
		const harness = await create(VEHICLE);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual({
			title: 'AB-123-CD',
			initials: 'AB',
			description: 'Renault Trafic...01/07',
			tags: ['In'],
			disabled: false,
		});
	});

	it('greys out a hidden vehicle without availability and labels it as hidden', async () => {
		// Arrange
		const harness = await create({ ...VEHICLE, visible: false, endAvailability: undefined });

		// Act
		const view = [await harness.view(), await harness.period()];

		// Assert
		expect(view).toEqual([
			expect.objectContaining({ disabled: true, tags: ['fr.vehicles.visible.false', 'In'] }),
			null,
		]);
	});

	it.each([
		{ name: 'a present vehicle in success', status: PresenceStatusEnum.IN, variant: 'success' },
		{ name: 'an absent vehicle as a warning', status: PresenceStatusEnum.OUT, variant: 'warning' },
		{ name: 'another status as neutral', status: PresenceStatusEnum.UNAVAILABLE, variant: 'neutral' },
	])('colours $name', async ({ status, variant }) => {
		// Arrange
		const harness = await create({ ...VEHICLE, status: { value: status, label: status } });

		// Act
		const shown = await harness.statusVariant();

		// Assert
		expect(shown).toBe(variant);
	});

	it('opens the movements history from the primary action', async () => {
		// Arrange
		const harness = await create(VEHICLE);

		// Act
		await defined(await harness.primary()).click();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('v1'));
	});
});
