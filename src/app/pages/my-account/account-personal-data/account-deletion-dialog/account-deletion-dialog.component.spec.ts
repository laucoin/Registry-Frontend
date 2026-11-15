import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegistryConfig } from '@core/config/registry.config';
import { AccountDeletionDialogComponent } from '@pages/my-account/account-personal-data/account-deletion-dialog/account-deletion-dialog.component';
import { AccountDeletionDialogHarness } from '@pages/my-account/account-personal-data/account-deletion-dialog/testing/account-deletion-dialog.harness';

const PHRASE = 'supprimer mon compte';

@Component({
	imports: [AccountDeletionDialogComponent],
	template: `<app-account-deletion-dialog [(open)]="open" (confirmed)="confirmations = confirmations + 1" />`,
})
class HostComponent {
	public readonly open = signal(true);
	public confirmations = 0;
}

describe('AccountDeletionDialogComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(): Promise<AccountDeletionDialogHarness> {
		fixture = TestBed.createComponent(HostComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, AccountDeletionDialogHarness);
	}

	beforeEach(() => {
		RegistryConfig.config = { application: { organization: 'SGDF' } } as typeof RegistryConfig.config;
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { myAccount: { personalData: { delete: { confirmation: { phrase: PHRASE } } } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
		});
	});

	it.each([
		{ name: 'keeps the deletion disabled before anything is typed', typed: undefined, disabled: true },
		{ name: 'keeps the deletion disabled for another phrase', typed: 'supprimer', disabled: true },
		{ name: 'enables the deletion for the exact phrase', typed: PHRASE, disabled: false },
		{ name: 'ignores the case and the surrounding spaces', typed: '  Supprimer MON compte ', disabled: false },
	])('$name', async ({ typed, disabled }) => {
		// Arrange
		const harness = await create();

		// Act
		if (typed !== undefined) await harness.type(typed);

		// Assert
		expect(await harness.acceptDisabled()).toBe(disabled);
	});

	it('closes, clears the phrase and confirms once the phrase is typed', async () => {
		// Arrange
		const harness = await create();
		await harness.type(PHRASE);

		// Act
		await harness.accept();

		// Assert
		expect([
			fixture.componentInstance.open(),
			await harness.typedText(),
			fixture.componentInstance.confirmations,
		]).toEqual([false, '', 1]);
	});

	it('confirms nothing while the phrase is not typed', async () => {
		// Arrange
		const harness = await create();
		await harness.type('supprimer');

		// Act
		await harness.accept();

		// Assert
		expect([fixture.componentInstance.open(), fixture.componentInstance.confirmations]).toEqual([true, 0]);
	});

	it('closes without confirming on cancel', async () => {
		// Arrange
		const harness = await create();

		// Act
		await harness.cancel();

		// Assert
		expect([fixture.componentInstance.open(), fixture.componentInstance.confirmations]).toEqual([false, 0]);
	});

	it('clears the phrase when the dialog hides itself', async () => {
		// Arrange
		const harness = await create();
		await harness.type(PHRASE);

		// Act
		await harness.hide();

		// Assert
		expect([fixture.componentInstance.open(), await harness.typedText()]).toEqual([false, '']);
	});

	it('stays open when an element inside the dialog hides its own panel', async () => {
		// Arrange
		await create();
		const input: HTMLElement = fixture.nativeElement.querySelector(
			'[data-test-id="account-deletion-dialog-type-to-confirm-input"]',
		);

		// Act
		input.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

		// Assert
		expect(fixture.componentInstance.open()).toBe(true);
	});
});
