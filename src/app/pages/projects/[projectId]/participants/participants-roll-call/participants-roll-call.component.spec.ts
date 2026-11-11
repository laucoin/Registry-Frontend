import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ParticipantsRollCallComponent } from '@pages/projects/[projectId]/participants/participants-roll-call/participants-roll-call.component';
import { ParticipantsRollCallHarness } from '@pages/projects/[projectId]/participants/participants-roll-call/testing/participants-roll-call.harness';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';

describe('ParticipantsRollCallComponent', () => {
	let fixture: ComponentFixture<ParticipantsRollCallComponent>;
	let cleared: number;

	function create(checkedCount: number): Promise<ParticipantsRollCallHarness> {
		fixture = TestBed.createComponent(ParticipantsRollCallComponent);
		fixture.componentRef.setInput('checkedCount', checkedCount);
		fixture.componentInstance.uncheckedAll.subscribe(() => (cleared += 1));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ParticipantsRollCallHarness);
	}

	beforeEach(() => {
		cleared = 0;
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							projectHome: {
								participantsPage: {
									checked: {
										zero: 'none ticked',
										one: '{{ count }} ticked',
										few: '{{ count }} ticked',
									},
									disclaimer: 'Check twice',
								},
							},
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [PluralTranslationPipe],
		});
	});

	it.each([
		{ name: 'nothing to clear before a participant is ticked', count: 0, expected: ['none ticked', false] },
		{ name: 'to clear the ticked participants', count: 3, expected: ['3 ticked', true] },
	])('counts the ticked participants and offers $name', async ({ count, expected }) => {
		// Arrange
		const harness = await create(count);

		// Act
		const shown = [await harness.countText(), await harness.canUncheck()];

		// Assert
		expect(shown).toEqual(expected);
	});

	it('reminds to check the information and asks the page to clear the ticks', async () => {
		// Arrange
		const harness = await create(2);

		// Act
		await harness.uncheckAll();

		// Assert
		expect([await harness.disclaimer(), cleared]).toEqual(['Check twice', 1]);
	});
});
