import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { FavoriteToggleComponent } from '@shared/ui/common/favorite-toggle/favorite-toggle.component';
import { FavoriteToggleHarness } from '@shared/ui/common/favorite-toggle/testing/favorite-toggle.harness';

describe('FavoriteToggleComponent', () => {
	let fixture: ComponentFixture<FavoriteToggleComponent>;

	async function create(favorite: boolean): Promise<FavoriteToggleHarness> {
		fixture = TestBed.createComponent(FavoriteToggleComponent);
		fixture.componentRef.setInput('favorite', favorite);
		fixture.componentRef.setInput('name', 'Camp');
		return TestbedHarnessEnvironment.harnessForFixture(fixture, FavoriteToggleHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it.each([
		{
			name: 'shows a filled amber star for a favorite',
			favorite: true,
			expected: ['true', 'solid', 'warning', 'fr.global.favorite.remove'],
		},
		{
			name: 'shows an outlined neutral star otherwise',
			favorite: false,
			expected: ['false', 'regular', 'neutral', 'fr.global.favorite.add'],
		},
	])('$name', async ({ favorite, expected }) => {
		// Arrange
		const harness = await create(favorite);

		// Act
		const shown = [
			await harness.pressed(),
			await harness.library(),
			await harness.variant(),
			await harness.label(),
		];

		// Assert
		expect(shown).toEqual(expected);
	});

	it('emits when the user clicks the star', async () => {
		// Arrange
		const harness = await create(false);
		let toggles = 0;
		fixture.componentInstance.toggled.subscribe(() => toggles++);

		// Act
		await harness.toggle();

		// Assert
		expect(toggles).toBe(1);
	});
});
