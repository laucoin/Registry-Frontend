import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { AccountLanguageComponent } from '@pages/my-account/account-language/account-language.component';
import {
	AccountLanguageHarness,
	AccountLanguageSelectHarness,
} from '@pages/my-account/account-language/testing/account-language.harness';

describe('AccountLanguageComponent', () => {
	let pending: WritableSignal<string | undefined>;
	let update: Mock<(language: string) => void>;
	let facade: Record<string, unknown>;

	async function create<T extends AccountLanguageHarness>(
		languages: string[],
		harnessType: typeof AccountLanguageHarness = AccountLanguageHarness,
	): Promise<T> {
		facade['availableLanguages'] = languages;
		const fixture = TestBed.createComponent(AccountLanguageComponent);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, harnessType) as Promise<T>;
	}

	beforeEach(() => {
		pending = signal<string | undefined>(undefined);
		update = vi.fn();
		facade = { currentUserLanguage: signal('fr'), pendingLanguage: pending, updateCurrentUserLanguage: update };
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [{ provide: SessionFacade, useValue: facade }],
		});
	});

	it('frames the languages with the language icon, title and hint', async () => {
		// Arrange
		const preference = await (await create(['fr', 'en'])).preference();

		// Act
		const shown = [await preference.icon(), await preference.title(), await preference.hint()];

		// Assert
		expect(shown).toEqual(['language', 'fr.myAccount.language.title', 'fr.myAccount.language.hint']);
	});

	it.each([
		{ name: 'no language is configured', languages: [] },
		{ name: 'a single language is configured', languages: ['fr'] },
	])('only names the current language when $name', async ({ languages }) => {
		// Arrange
		const harness = await create(languages);

		// Act
		const shown = [await harness.onlyText(), await harness.hasControl()];

		// Assert
		expect(shown).toEqual(['fr.myAccount.language.only', false]);
	});

	it.each([
		{ name: 'buttons for two languages', languages: ['fr', 'en'], harnessType: AccountLanguageHarness },
		{
			name: 'a select past two languages',
			languages: ['fr', 'en', 'de'],
			harnessType: AccountLanguageSelectHarness,
		},
	])('offers $name and marks the current one', async ({ languages, harnessType }) => {
		// Arrange
		const harness = await create(languages, harnessType);

		// Act
		const shown = [await harness.choices(), await harness.value(), await harness.onlyText()];

		// Assert
		expect(shown).toEqual([
			languages.map((language) => ({ value: language, label: `fr.myAccount.language.${language}` })),
			'fr',
			undefined,
		]);
	});

	it.each([
		{ name: 'buttons', languages: ['fr', 'en'], harnessType: AccountLanguageHarness, chosen: 'en' },
		{ name: 'select', languages: ['fr', 'en', 'de'], harnessType: AccountLanguageSelectHarness, chosen: 'de' },
	])('hands the language chosen in the $name to the session', async ({ languages, harnessType, chosen }) => {
		// Arrange
		const harness = await create(languages, harnessType);

		// Act
		await harness.choose(chosen);

		// Assert
		expect(update).toHaveBeenCalledWith(chosen);
	});

	it.each([
		{ name: 'buttons', languages: ['fr', 'en'], harnessType: AccountLanguageHarness },
		{ name: 'select', languages: ['fr', 'en', 'de'], harnessType: AccountLanguageSelectHarness },
	])('disables the $name only while a language is being saved', async ({ languages, harnessType }) => {
		// Arrange
		const harness = await create(languages, harnessType);
		const idle = await harness.disabled();

		// Act
		pending.set('en');

		// Assert
		expect([idle, await harness.disabled()]).toEqual([false, true]);
	});
});
