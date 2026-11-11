import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { MovementTypeEnum } from '@shared/models/enumeration/movement-type.enum';
import { MovementContentModel } from '@shared/models/model/movement-content.model';
import { MovementPeopleComponent } from '@shared/ui/domain/movement-element/movement-people/movement-people.component';
import { MovementPeopleHarness } from '@shared/ui/domain/movement-element/movement-people/testing/movement-people.harness';
import { person } from '@shared/ui/domain/movement-element/testing/movement-fixtures';

describe('MovementPeopleComponent', () => {
	let fixture: ComponentFixture<MovementPeopleComponent>;

	async function create(canReverse: boolean): Promise<MovementPeopleHarness> {
		fixture = TestBed.createComponent(MovementPeopleComponent);
		fixture.componentRef.setInput('contents', [person('ada', true, 'car 1', 'v1'), person('bob', false)]);
		fixture.componentRef.setInput('type', MovementTypeEnum.IN);
		fixture.componentRef.setInput('canReverse', canReverse);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementPeopleHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('lists each person with the family name in capitals and the vehicle they use', async () => {
		// Arrange
		const harness = await create(false);

		// Act
		const people = await harness.people();

		// Assert
		expect(people).toEqual([
			{ name: 'Ada ADASON', vehicle: 'Renault Trafic (V1)', reversible: false },
			{ name: 'Bob BOBSON', vehicle: undefined, reversible: false },
		]);
	});

	it('asks for the reverse movement of a single person when allowed', async () => {
		// Arrange
		const harness = await create(true);
		const reversed: MovementContentModel[][] = [];
		fixture.componentInstance.reversed.subscribe((contents) => reversed.push(contents));

		// Act
		await harness.reverse('bob');

		// Assert
		expect(reversed.map((contents) => contents.map((content) => content.participant.id))).toEqual([['bob']]);
	});
});
