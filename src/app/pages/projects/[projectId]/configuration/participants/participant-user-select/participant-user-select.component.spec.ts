import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantUserSelectComponent } from '@pages/projects/[projectId]/configuration/participants/participant-user-select/participant-user-select.component';
import { ParticipantUserSelectHarness } from '@pages/projects/[projectId]/configuration/participants/participant-user-select/testing/participant-user-select.harness';
import { SelectOptionModel } from '@shared/models/model/select-option.model';
import { UserModel } from '@shared/models/model/user.model';

const item = (id: string): SelectOptionModel<UserModel> => ({ label: id, value: { id } as UserModel });

@Component({
	imports: [ParticipantUserSelectComponent],
	templateUrl: './participant-user-select.component.spec.html',
})
class HostComponent {
	public readonly user = signal<SelectOptionModel<UserModel> | null>(null);
	public readonly chosen: (SelectOptionModel<UserModel> | null)[] = [];
}

describe('ParticipantUserSelectComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let searched: WritableSignal<SelectOptionModel<UserModel>[]>;
	let search: Mock<(query: string) => void>;

	async function create(user: SelectOptionModel<UserModel> | null = null): Promise<ParticipantUserSelectHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.user.set(user);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ParticipantUserSelectHarness);
	}

	beforeEach(() => {
		searched = signal([item('u1')]);
		search = vi.fn();
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ParticipantFacade, useValue: { searchedUsersMetadata: searched, searchUsers: search } },
			],
		});
	});

	it('searches the users when opened and when typed', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.open();
		await harness.search('gra');

		// Assert
		expect(search.mock.calls).toEqual([[''], ['gra']]);
	});

	it.each([
		{
			name: 'keeps the linked user first when the search no longer finds it',
			user: item('u9'),
			options: ['u9', 'u1'],
		},
		{ name: 'does not list the linked user twice', user: item('u1'), options: ['u1'] },
		{ name: 'offers the found users when none is linked', user: null, options: ['u1'] },
	])('$name', async ({ user, options }) => {
		// Arrange
		const harness = await create(user);

		// Act
		const shown = await harness.options();

		// Assert
		expect(shown).toEqual(options);
	});

	it.each([
		{ name: 'signals the chosen user', id: 'u1', expected: item('u1') },
		{ name: 'signals no user for a cleared choice', id: '', expected: null },
	])('$name', async ({ id, expected }) => {
		// Arrange
		const harness = await create();

		// Act
		await harness.choose(id);

		// Assert
		expect(fixture.componentInstance.chosen).toEqual([expected]);
	});
});
