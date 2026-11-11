import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ClockService } from '@shared/helpers/clock.service';
import { MovementModel } from '@shared/models/model/movement.model';
import { MovementDetailsComponent } from '@shared/ui/domain/movement-element/movement-details/movement-details.component';
import {
	DetailsButtonEnum,
	MovementDetailsHarness,
} from '@shared/ui/domain/movement-element/movement-details/testing/movement-details.harness';
import { movementOf, person } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

const NOW = new Date('2026-01-05T10:00:00Z').getTime();

describe('MovementDetailsComponent', () => {
	let fixture: ComponentFixture<MovementDetailsComponent>;
	let opened: string[];

	async function create(
		movement: MovementModel,
		inputs: Record<string, unknown> = {},
	): Promise<MovementDetailsHarness> {
		fixture = TestBed.createComponent(MovementDetailsComponent);
		fixture.componentRef.setInput('movement', movement);
		Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
		opened = [];
		fixture.componentInstance.participantsOpened.subscribe(() => opened.push('participants'));
		fixture.componentInstance.vehiclesOpened.subscribe(() => opened.push('vehicles'));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementDetailsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: DatePipe, useValue: { transform: (): string => '01/01/2026 11:00' } },
				{ provide: ClockService, useValue: { now: signal(NOW) } },
			],
		});
	});

	it('shows the date of the movement', async () => {
		// Arrange
		const harness = await create(movementOf());

		// Act
		const date = await harness.dateText();

		// Assert
		expect(date).toBe('01/01/2026 11:00');
	});

	it('shows a placeholder while the movement has no content yet', async () => {
		// Arrange
		const harness = await create(movementOf({ content: [] }));

		// Act
		const loading = await harness.loading();

		// Assert
		expect(loading).toBe(true);
		expect(await harness.buttonText(DetailsButtonEnum.PARTICIPANTS)).toBeUndefined();
	});

	it.each([
		{
			name: 'opens the people from the participants button',
			vehicleId: undefined,
			button: DetailsButtonEnum.PARTICIPANTS,
		},
		{
			name: 'opens the people from the driver of the shown vehicle',
			vehicleId: 'v1',
			button: DetailsButtonEnum.DRIVER,
		},
	])('$name', async ({ vehicleId, button }) => {
		// Arrange
		const harness = await create(movementOf(), { vehicleId });

		// Act
		await harness.click(button);

		// Assert
		expect(opened).toEqual(['participants']);
	});

	it('names the driver of the shown vehicle with the family name in capitals', async () => {
		// Arrange
		const harness = await create(movementOf(), { vehicleId: 'v1' });

		// Act
		const driver = await harness.buttonText(DetailsButtonEnum.DRIVER);

		// Assert
		expect(driver).toBe('ada ADASON');
	});

	it('shows the participants button when the shown vehicle is not in the movement', async () => {
		// Arrange
		const harness = await create(movementOf(), { vehicleId: 'unknown' });

		// Act
		const shown = [
			await harness.buttonText(DetailsButtonEnum.DRIVER),
			await harness.buttonText(DetailsButtonEnum.PARTICIPANTS),
		];

		// Assert
		expect(shown).toEqual([undefined, 'fr.movements.content.few']);
	});

	it.each([
		{
			name: 'counts a vehicle used by several people once',
			vehicles: ['v1', 'v1'],
			expected: 'fr.movements.vehicles-count.one',
		},
		{ name: 'counts each distinct vehicle', vehicles: ['v1', 'v2'], expected: 'fr.movements.vehicles-count.few' },
	])('$name', async ({ vehicles, expected }) => {
		// Arrange
		const content = vehicles.map((vehicle, index) => person(`p${index}`, true, 'car', vehicle));

		// Act
		const harness = await create(movementOf({ content }));

		// Assert
		expect(await harness.buttonText(DetailsButtonEnum.VEHICLES)).toBe(expected);
	});

	it('opens the vehicles from the vehicles button', async () => {
		// Arrange
		const harness = await create(movementOf());

		// Act
		await harness.click(DetailsButtonEnum.VEHICLES);

		// Assert
		expect(opened).toEqual(['vehicles']);
	});

	it('shows no vehicles button for a movement without vehicle', async () => {
		// Arrange
		const movement = movementOf({ content: [person('bob', false)] });

		// Act
		const harness = await create(movement);

		// Assert
		expect(await harness.buttonText(DetailsButtonEnum.VEHICLES)).toBeUndefined();
	});

	it.each([
		{
			name: 'in days when the last communication is older than a day',
			last: '2026-01-02T10:00:00Z',
			expected: 'fr.movements.communication.days',
		},
		{ name: 'as a short elapsed time otherwise', last: '2026-01-05T09:30:00Z', expected: undefined },
	])('tells the time since the last communication $name', async ({ last, expected }) => {
		// Arrange
		const movement = movementOf({ lastCommunicationDateTime: new Date(last) });

		// Act
		const harness = await create(movement, { communication: true });

		// Assert
		const text = await harness.communicationText();
		expect(text).toContain('fr.movements.communication.last');
		if (expected) expect(text).toContain(expected);
		else expect(text).not.toContain('fr.movements.communication.days');
	});

	it('shows no last communication when the movement is not communicable', async () => {
		// Arrange
		const movement = movementOf({ lastCommunicationDateTime: new Date('2026-01-02T10:00:00Z') });

		// Act
		const harness = await create(movement, { communication: false });

		// Assert
		expect(await harness.communicationText()).toBeUndefined();
	});
});
