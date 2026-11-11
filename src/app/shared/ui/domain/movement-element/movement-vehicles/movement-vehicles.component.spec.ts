import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { MovementVehiclesComponent } from '@shared/ui/domain/movement-element/movement-vehicles/movement-vehicles.component';
import { MovementVehiclesHarness } from '@shared/ui/domain/movement-element/movement-vehicles/testing/movement-vehicles.harness';
import { movementOf, person } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

describe('MovementVehiclesComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('lists each vehicle once with its driver', async () => {
		// Arrange
		const fixture = TestBed.createComponent(MovementVehiclesComponent);
		fixture.componentRef.setInput(
			'movement',
			movementOf({
				content: [person('ada', true, 'car 1', 'v1'), person('cyd', true, 'car 1', 'v1'), person('bob', false)],
			}),
		);

		// Act
		const vehicles = await (
			await TestbedHarnessEnvironment.harnessForFixture(fixture, MovementVehiclesHarness)
		).vehicles();

		// Assert
		expect(vehicles).toEqual([{ id: 'v1', label: 'Renault Trafic (V1)', driver: 'Ada ADASON' }]);
	});
});
