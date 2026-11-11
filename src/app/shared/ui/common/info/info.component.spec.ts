import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { InfoComponent } from '@shared/ui/common/info/info.component';
import { InfoHarness } from '@shared/ui/common/info/testing/info.harness';

describe('InfoComponent', () => {
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it('introduces the application, its options, the invitations, then concludes', async () => {
		// Arrange
		const fixture = TestBed.createComponent(InfoComponent);

		// Act
		const texts = await (await TestbedHarnessEnvironment.harnessForFixture(fixture, InfoHarness)).texts();

		// Assert
		expect(texts).toEqual([
			'fr.global.welcome.introduction',
			'fr.global.welcome.option',
			'fr.global.welcome.invitations',
			'fr.global.welcome.conclusion',
		]);
	});
});
