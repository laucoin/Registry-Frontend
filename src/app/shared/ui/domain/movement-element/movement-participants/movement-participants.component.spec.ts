import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { MovementModel } from '@shared/models/model/movement.model';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementParticipantsComponent } from '@shared/ui/domain/movement-element/movement-participants/movement-participants.component';
import { MovementParticipantsHarness } from '@shared/ui/domain/movement-element/movement-participants/testing/movement-participants.harness';
import { movementOf, person } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

describe('MovementParticipantsComponent', () => {
	let fixture: ComponentFixture<MovementParticipantsComponent>;

	async function create(movement: MovementModel, canReverse = false): Promise<MovementParticipantsHarness> {
		fixture = TestBed.createComponent(MovementParticipantsComponent);
		fixture.componentRef.setInput('movement', movement);
		fixture.componentRef.setInput('canReverse', canReverse);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementParticipantsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('adds a tab for adults, children, each vehicle crew and the independent people of a pooled movement', async () => {
		// Arrange
		const harness = await create(movementOf());

		// Act
		const tabs = await harness.tabIds();

		// Assert
		expect(tabs).toEqual([
			'movement-participants-all-tab',
			'movement-participants-adults-tab',
			'movement-participants-children-tab',
			'movement-participants-pool-tab',
			'movement-participants-independent-tab',
		]);
	});

	it('keeps only the tab of everyone and of the present age group for a movement without pool', async () => {
		// Arrange
		const harness = await create(movementOf({ content: [person('ada', true)] }));

		// Act
		const tabs = await harness.tabIds();

		// Assert
		expect(tabs).toEqual(['movement-participants-all-tab', 'movement-participants-adults-tab']);
	});

	it('lists everyone first, then each group, in its panel', async () => {
		// Arrange
		const harness = await create(movementOf());

		// Act
		const panels = await Promise.all(
			(await harness.panels()).map(async (panel) => (await panel.people()).map((shown) => shown.name)),
		);

		// Assert
		expect(panels).toEqual([
			['Ada ADASON', 'Bob BOBSON'],
			['Ada ADASON'],
			['Bob BOBSON'],
			['Bob BOBSON'],
			['Ada ADASON'],
		]);
	});

	it('relays the reverse movement asked from a panel', async () => {
		// Arrange
		const harness = await create(movementOf(), true);
		const reversed: MovementContentModel[][] = [];
		fixture.componentInstance.reversed.subscribe((contents) => reversed.push(contents));

		// Act
		await (await harness.panels())[0].reverse('ada');

		// Assert
		expect(reversed[0].map((content) => content.participant.id)).toEqual(['ada']);
	});
});
