import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { informationRules } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-form.shared';
import { MovementInformationStepComponent } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-information-step/movement-information-step.component';
import { MovementInformationStepHarness } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-information-step/testing/movement-information-step.harness';

const EDITING = signal(false);

@Component({
	imports: [MovementInformationStepComponent],
	templateUrl: './movement-information-step.component.spec.html',
})
class HostComponent {
	public readonly model = signal({ information: { dateTime: new Date(2026, 0, 1) as Date | null, type: '' } });
	public readonly form = form(this.model, (path) =>
		informationRules(path.information, {
			project: signal(undefined),
			formatDate: (): string => '',
			editing: EDITING,
		}),
	);
	public readonly types: string[] = [];
	public nexts = 0;
	public cancels = 0;
}

describe('MovementInformationStepComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(editing = false): Promise<MovementInformationStepHarness> {
		EDITING.set(editing);
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementInformationStepHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{
					provide: MovementFacade,
					useValue: {
						movementTypesMetadata: signal([
							{ label: '-', value: undefined },
							{ label: 'In', value: 'IN' },
							{ label: 'Out', value: 'OUT' },
						]),
					},
				},
			],
		});
	});

	it('offers every movement type but the empty choice', async () => {
		// Arrange
		const harness = await create();

		// Act
		const types = await harness.types();

		// Assert
		expect(types).toEqual(['IN', 'OUT']);
	});

	it('binds the chosen type to the form and signals it', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.chooseType('OUT');

		// Assert
		expect([fixture.componentInstance.model().information.type, fixture.componentInstance.types]).toEqual([
			'OUT',
			['OUT'],
		]);
	});

	it.each([
		{ name: 'lets the type be chosen for a new movement', editing: false, disabled: false },
		{ name: 'locks the type of an edited movement', editing: true, disabled: true },
	])('$name', async ({ editing, disabled }) => {
		// Arrange
		const harness = await create(editing);

		// Act
		const locked = await harness.typeDisabled();

		// Assert
		expect(locked).toBe(disabled);
	});

	it('signals the next step and the cancellation', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.next();
		await harness.cancel();

		// Assert
		expect([fixture.componentInstance.nexts, fixture.componentInstance.cancels]).toEqual([1, 1]);
	});
});
