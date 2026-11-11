import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { AccountInfoComponent } from '@pages/my-account/account-info/account-info.component';
import {
	AccountInfoHarness,
	AccountInfoRowStateEnum,
} from '@pages/my-account/account-info/testing/account-info.harness';
import { CurrentUserModel } from '@shared/models/model/current-user.model';

const USER = {
	firstName: 'Grace',
	lastName: 'Hopper',
	email: 'grace@example.test',
	role: { label: 'Admin', value: 'ADMIN' },
	lastLogin: new Date('2026-01-01T10:00:00Z'),
} as CurrentUserModel;

describe('AccountInfoComponent', () => {
	let user: WritableSignal<CurrentUserModel | undefined>;

	async function create(current: CurrentUserModel | undefined): Promise<AccountInfoHarness> {
		user.set(current);
		const fixture = TestBed.createComponent(AccountInfoComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AccountInfoHarness);
	}

	beforeEach(() => {
		RegistryConfig.config = { application: { organization: 'SGDF' } } as typeof RegistryConfig.config;
		user = signal<CurrentUserModel | undefined>(undefined);
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [{ provide: SessionFacade, useValue: { currentUser: user } }],
		});
	});

	it('titles the section and explains where the values come from', async () => {
		// Arrange
		const harness = await create(USER);

		// Act
		const texts = [await harness.title(), await harness.hint()];

		// Assert
		expect(texts.map((text) => text.trim())).toEqual(['fr.myAccount.info.title', 'fr.myAccount.info.hint']);
	});

	it('shows a skeleton on every row and flags the table busy while the user is loading', async () => {
		// Arrange
		const harness = await create(undefined);

		// Act
		const states = await Promise.all(['name', 'email', 'role', 'last-login'].map((id) => harness.row(id)));

		// Assert
		expect([states.map((row) => row.state), await harness.busy()]).toEqual([
			['loading', 'loading', 'loading', 'loading'],
			'true',
		]);
	});

	it('shows the identity of the user once loaded', async () => {
		// Arrange
		const harness = await create(USER);

		// Act
		const rows = await Promise.all(['name', 'email', 'role', 'last-login'].map((id) => harness.row(id)));

		// Assert
		expect([rows, await harness.busy()]).toEqual([
			[
				{ label: 'fr.myAccount.info.name', state: AccountInfoRowStateEnum.VALUE, text: 'Grace Hopper' },
				{ label: 'fr.myAccount.info.email', state: AccountInfoRowStateEnum.VALUE, text: 'grace@example.test' },
				{ label: 'fr.myAccount.info.role', state: AccountInfoRowStateEnum.VALUE, text: 'Admin' },
				{ label: 'fr.myAccount.info.lastLogin', state: AccountInfoRowStateEnum.DATE, text: '' },
			],
			'false',
		]);
	});

	it.each([
		{ name: 'the first name alone', firstName: 'Grace', lastName: undefined, expected: 'Grace' },
		{
			name: 'the e-mail without any name',
			firstName: undefined,
			lastName: undefined,
			expected: 'grace@example.test',
		},
	])('names the user with $name', async ({ firstName, lastName, expected }) => {
		// Arrange
		const harness = await create({ ...USER, firstName, lastName } as CurrentUserModel);

		// Act
		const row = await harness.row('name');

		// Assert
		expect(row.text).toBe(expected);
	});

	it('shows a placeholder for a value the user does not have', async () => {
		// Arrange
		const harness = await create({ ...USER, role: undefined, lastLogin: undefined } as unknown as CurrentUserModel);

		// Act
		const rows = await Promise.all(['role', 'last-login'].map((id) => harness.row(id)));

		// Assert
		expect(rows.map(({ state, text }) => [state, text])).toEqual([
			['empty', 'fr.myAccount.info.empty'],
			['empty', 'fr.myAccount.info.empty'],
		]);
	});
});
