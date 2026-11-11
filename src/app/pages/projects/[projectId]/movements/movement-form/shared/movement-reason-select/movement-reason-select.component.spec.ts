import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { form } from '@angular/forms/signals';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import { MovementReasonSelectComponent } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-reason-select/movement-reason-select.component';
import { MovementReasonSelectHarness } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-reason-select/testing/movement-reason-select.harness';
import { MovementReasonKindEnum } from '@shared/models/enumeration/movement-reason-kind.enum';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { MovementReasonModel } from '@shared/models/model/movement-reason.model';

const HIKE: MovementReasonModel = { kind: MovementReasonKindEnum.ACTIVITY, value: 'a1', label: 'Hike' };
const OLD: MovementReasonModel = { kind: MovementReasonKindEnum.REASON, value: 'r9', label: 'Old reason' };

@Component({
	imports: [MovementReasonSelectComponent],
	templateUrl: './movement-reason-select.component.spec.html',
})
class HostComponent {
	public readonly participantType = ParticipantTypeEnum.GUEST;
	public readonly model = signal({ reason: null as MovementReasonModel | null });
	public readonly form = form(this.model);
}

describe('MovementReasonSelectComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let searched: WritableSignal<MovementReasonModel[]>;
	let search: Mock<(query: string, type: string, participantType: ParticipantTypeEnum) => void>;

	async function create(reason: MovementReasonModel | null = null): Promise<MovementReasonSelectHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.model.set({ reason });
		return TestbedHarnessEnvironment.harnessForFixture(fixture, MovementReasonSelectHarness);
	}

	beforeEach(() => {
		searched = signal([HIKE]);
		search = vi.fn();
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{
					provide: MovementFacade,
					useValue: { searchedReasonAndActivityMetadata: searched, searchReasonsAndActivities: search },
				},
			],
		});
	});

	it('searches the reasons of the movement and participant types when opened and when typed', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.open();
		await harness.search('camp');

		// Assert
		expect(search.mock.calls).toEqual([
			['', 'IN', ParticipantTypeEnum.GUEST],
			['camp', 'IN', ParticipantTypeEnum.GUEST],
		]);
	});

	it.each([
		{
			name: 'keeps the chosen reason among the options',
			reason: OLD,
			options: ['Old reason', 'Hike'],
			value: 'REASON:r9',
		},
		{ name: 'offers the searched reasons only before a choice', reason: null, options: ['Hike'], value: '' },
	])('$name', async ({ reason, options, value }) => {
		// Arrange
		const harness = await create(reason);

		// Act
		const shown = [await harness.options(), await harness.value()];

		// Assert
		expect(shown).toEqual([options, value]);
	});

	it.each([
		{ name: 'writes the chosen reason in the form', key: 'ACTIVITY:a1', expected: HIKE },
		{ name: 'clears the reason for an unknown choice', key: '', expected: null },
	])('$name', async ({ key, expected }) => {
		// Arrange
		const harness = await create(OLD);

		// Act
		await harness.choose(key);

		// Assert
		expect(fixture.componentInstance.model().reason).toEqual(expected);
	});
});
