import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	createRegisteredMovementForm,
	emptyRegisteredMovementFormModel,
} from '@pages/projects/[projectId]/movements/movement-form/registered/registered-movement.form';
import { RegisteredParticipantsFieldsComponent } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-participants-fields/registered-participants-fields.component';
import { RegisteredParticipantsFieldsHarness } from '@pages/projects/[projectId]/movements/movement-form/registered/registered-participants-fields/testing/registered-participants-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ParticipantTypeEnum } from '@shared/models/enumeration/participant-type.enum';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { GroupModel } from '@shared/models/model/group.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const AT = new Date(2026, 0, 1, 10);

const participant = (id: string, status?: PresenceStatusEnum): ParticipantModel =>
	({
		id,
		firstName: id,
		lastName: 'Doe',
		major: true,
		status: status && { value: status, label: status },
	}) as ParticipantModel;

const SCOUTS = {
	id: 'g1',
	name: 'Scouts',
	members: [participant('ada', PresenceStatusEnum.IN), participant('bob', PresenceStatusEnum.OUT)],
} as GroupModel;

@Component({
	imports: [RegisteredParticipantsFieldsComponent],
	templateUrl: './registered-participants-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(emptyRegisteredMovementFormModel(AT));
	public readonly form = createRegisteredMovementForm(this.model, {
		project: signal(undefined),
		formatDate: (): string => '',
		editing: (): boolean => false,
	});
	public readonly dateTime = signal<Date | null>(AT);
	public readonly presence = [PresenceStatusEnum.IN];
}

describe('RegisteredParticipantsFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let search: Mock<(...args: unknown[]) => void>;

	async function create(dateTime: Date | null = AT): Promise<RegisteredParticipantsFieldsHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.dateTime.set(dateTime);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, RegisteredParticipantsFieldsHarness);
	}

	beforeEach(() => {
		search = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							movements: {
								form: {
									content: { registered: { group: 'Group {{ name }}' } },
									warning: { participant: { IN: 'Already in' } },
								},
							},
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: MovementFacade,
					useValue: {
						searchedParticipantAndGroupMetadata: signal([
							{ label: 'Groups', items: [{ label: 'Scouts', value: SCOUTS }] },
						]),
						searchParticipantsAndGroups: search,
					},
				},
			],
		});
	});

	it('searches the participants present at the movement date when opened and when typed', async () => {
		// Arrange
		const harness = await create();
		const field = await harness.field();

		// Act
		await field.open();
		await field.search('ada');

		// Assert
		expect(search.mock.calls).toEqual([
			[ParticipantTypeEnum.REGISTERED, '', AT, false],
			[ParticipantTypeEnum.REGISTERED, 'ada', AT, false],
		]);
	});

	it('widens the search to the whole project on demand', async () => {
		// Arrange
		const harness = await create();
		const toggle = fixture.debugElement.query(By.css(byTestId('registered-participants-fields-all-switch')));
		(toggle.nativeElement as { checked: boolean }).checked = true;

		// Act
		await harness.widen();

		// Assert
		expect(search.mock.calls).toEqual([[ParticipantTypeEnum.REGISTERED, undefined, AT, true]]);
	});

	it('does not search before the movement has a date', async () => {
		// Arrange
		const harness = await create(null);

		// Act
		await (await harness.field()).open();

		// Assert
		expect(search).not.toHaveBeenCalled();
	});

	it('adds the members of a chosen group under its name and warns about the ones already present', async () => {
		// Arrange
		const harness = await create();
		const field = await harness.field();

		// Act
		await field.choose('g1');

		// Assert
		expect([await field.groups(), (await field.selection()).map((row) => row.warning)]).toEqual([
			['Group Scouts'],
			['Already in', undefined],
		]);
	});
});
