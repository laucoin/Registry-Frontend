import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { SessionFacade } from '@core/registry/state/session.facade';
import { AccountPersonalDataComponent } from '@pages/my-account/account-personal-data/account-personal-data.component';
import { AccountPersonalDataHarness } from '@pages/my-account/account-personal-data/testing/account-personal-data.harness';
import { AccountActionEnum } from '@shared/models/enumeration/account-action.enum';

const PHRASE = 'supprimer mon compte';

@Component({ template: '' })
class EmptyComponent {}

describe('AccountPersonalDataComponent', () => {
	let facade: {
		pendingAccountAction: WritableSignal<AccountActionEnum | undefined>;
		exportAccount: Mock<() => void>;
		deleteAccount: Mock<() => void>;
	};

	async function create(): Promise<AccountPersonalDataHarness> {
		const fixture = TestBed.createComponent(AccountPersonalDataComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AccountPersonalDataHarness);
	}

	beforeEach(() => {
		RegistryConfig.config = { application: { organization: 'SGDF' } } as typeof RegistryConfig.config;
		facade = { pendingAccountAction: signal(undefined), exportAccount: vi.fn(), deleteAccount: vi.fn() };
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { myAccount: { personalData: { delete: { confirmation: { phrase: PHRASE } } } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				{ provide: SessionFacade, useValue: facade },
			],
		});
	});

	it('titles the section and links to the privacy page', async () => {
		// Arrange
		const harness = await create();

		// Act
		const shown = [await harness.title(), await harness.privacyLink()];

		// Assert
		expect(shown).toEqual(['myAccount.personalData.title', '/privacy']);
	});

	it('exports the account data', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.export();

		// Assert
		expect(facade.exportAccount).toHaveBeenCalledOnce();
	});

	it('asks for a confirmation before deleting the account', async () => {
		// Arrange
		const harness = await create();
		const dialog = await harness.deletionDialog();
		const closedBefore = await dialog.isOpen();

		// Act
		await harness.requestDeletion();

		// Assert
		expect([closedBefore, await dialog.isOpen(), facade.deleteAccount.mock.calls.length]).toEqual([false, true, 0]);
	});

	it('deletes the account once the confirmation phrase is typed and accepted', async () => {
		// Arrange
		const harness = await create();
		await harness.requestDeletion();
		const dialog = await harness.deletionDialog();
		await dialog.type(PHRASE);

		// Act
		await dialog.accept();

		// Assert
		expect(facade.deleteAccount).toHaveBeenCalledOnce();
	});

	it.each([
		{
			name: 'offers both actions when none is in progress',
			pending: undefined,
			expected: { export: { loading: false, disabled: false }, deletion: { loading: false, disabled: false } },
		},
		{
			name: 'shows the export in progress and blocks both actions',
			pending: AccountActionEnum.EXPORT,
			expected: { export: { loading: true, disabled: true }, deletion: { loading: false, disabled: true } },
		},
		{
			name: 'shows the deletion in progress and blocks both actions',
			pending: AccountActionEnum.DELETION,
			expected: { export: { loading: false, disabled: true }, deletion: { loading: true, disabled: true } },
		},
	])('$name', async ({ pending, expected }) => {
		// Arrange
		facade.pendingAccountAction.set(pending);

		// Act
		const states = await (await create()).actionStates();

		// Assert
		expect(states).toEqual(expected);
	});
});
