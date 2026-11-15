import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { GuestListFieldsComponent } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-list-fields/guest-list-fields.component';
import { GuestListFieldsHarness } from '@pages/projects/[projectId]/movements/movement-form/guest/guest-list-fields/testing/guest-list-fields.harness';
import {
	createGuestMovementForm,
	emptyGuest,
	emptyGuestMovementFormModel,
	MovementGuestModel,
} from '@pages/projects/[projectId]/movements/movement-form/guest/guest-movement.form';

const KNOWN: MovementGuestModel = { id: 'g1', firstName: 'Ada', lastName: 'Lovelace', birthday: new Date(2010, 0, 5) };

@Component({
	imports: [GuestListFieldsComponent],
	templateUrl: './guest-list-fields.component.spec.html',
})
class HostComponent {
	public readonly model = signal(emptyGuestMovementFormModel(new Date(2026, 0, 1)));
	public readonly form = createGuestMovementForm(this.model, {
		project: signal(undefined),
		formatDate: (): string => '',
		editing: (): boolean => false,
	});
}

describe('GuestListFieldsComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(guests: MovementGuestModel[]): Promise<GuestListFieldsHarness> {
		fixture = TestBed.createComponent(HostComponent);
		const model = fixture.componentInstance.model;
		model.set({ information: { ...model().information, type: 'IN' }, content: { ...model().content, guests } });
		return TestbedHarnessEnvironment.harnessForFixture(fixture, GuestListFieldsHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							movements: { form: { content: { guest: { one: '1 guest', many: '{{ count }} guests' } } } },
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
		});
	});

	it('shows each guest and only lets a guest not yet registered be removed', async () => {
		// Arrange
		const harness = await create([KNOWN, emptyGuest()]);

		// Act
		const guests = await harness.guests();

		// Assert
		expect(guests).toEqual([
			{ firstName: 'Ada', lastName: 'Lovelace', removable: false },
			{ firstName: '', lastName: '', removable: true },
		]);
	});

	it('binds the typed names to the form', async () => {
		// Arrange
		const harness = await create([emptyGuest()]);

		// Act
		await harness.typeName(0, 'Grace', 'Hopper');

		// Assert
		const [guest] = fixture.componentInstance.model().content.guests;
		expect([guest.firstName, guest.lastName]).toEqual(['Grace', 'Hopper']);
	});

	it('adds an empty guest after the others', async () => {
		// Arrange
		const harness = await create([KNOWN]);

		// Act
		await harness.add();

		// Assert
		expect(fixture.componentInstance.model().content.guests).toMatchObject([KNOWN, emptyGuest()]);
	});

	it('removes the chosen guest and keeps the others', async () => {
		// Arrange
		const harness = await create([KNOWN, { ...emptyGuest(), firstName: 'Grace' }]);

		// Act
		await harness.remove(1);

		// Assert
		expect(fixture.componentInstance.model().content.guests).toMatchObject([KNOWN]);
	});
});
