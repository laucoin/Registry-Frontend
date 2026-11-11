import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { AccountPreferenceComponent } from '@pages/my-account/account-preference/account-preference.component';
import { AccountPreferenceHarness } from '@pages/my-account/account-preference/testing/account-preference.harness';

@Component({
	imports: [AccountPreferenceComponent],
	template: `<app-account-preference icon="palette" titleKey="theme.title" hintKey="theme.hint">
		<span>control</span>
	</app-account-preference>`,
})
class HostComponent {}

describe('AccountPreferenceComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('frames the projected control with its icon, title and hint', async () => {
		// Arrange
		const fixture = TestBed.createComponent(HostComponent);
		const harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, AccountPreferenceHarness);

		// Act
		const shown = [
			await harness.icon(),
			await harness.title(),
			await harness.hint(),
			(await (await harness.host()).text()).includes('control'),
		];

		// Assert
		expect(shown).toEqual(['palette', 'fr.theme.title', 'fr.theme.hint', true]);
	});
});
