import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { RegularizationRowComponent } from '@pages/projects/[projectId]/widgets/regularization-row/regularization-row.component';
import { RegularizationRowHarness } from '@pages/projects/[projectId]/widgets/regularization-row/testing/regularization-row.harness';
import { MovementPrefillService } from '@shared/helpers/movement-prefill.service';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { ParticipantModel } from '@shared/models/model/participant.model';

@Component({
	imports: [RegularizationRowComponent],
	template: '<sgdf-list-item appRegularizationRow [participant]="participant()" />',
})
class HostComponent {
	public readonly participant = signal<ParticipantModel>(ParticipantMapper.toModel(PARTICIPANT_DTO));
}

describe('RegularizationRowComponent', () => {
	let openRegularization: Mock<(participant: ParticipantModel) => void>;

	async function create(overrides: Partial<ParticipantModel>): Promise<RegularizationRowHarness> {
		const fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.participant.update((participant) => ({ ...participant, ...overrides }));
		return TestbedHarnessEnvironment.loader(fixture).getHarness(RegularizationRowHarness);
	}

	beforeEach(() => {
		openRegularization = vi.fn();
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							projectHome: {
								participantRegularization: {
									plannedEnd: 'ends {{ date }}',
									presentSince: 'here since {{ duration }}',
								},
							},
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: MovementPrefillService,
					useValue: { creationUrl: (type: string): string => `/create/${type}`, openRegularization },
				},
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				PluralTranslationPipe,
			],
		});
	});

	it.each([
		{
			name: 'its planned end and how long it has been here',
			overrides: {
				endAvailability: { date: '2026-01-01', time: undefined },
				effectiveArrival: new Date('2025-12-30T10:00:00Z'),
			},
			detail: 'ends date · here since global.date-and-time-format.interval',
		},
		{
			name: 'its planned end only',
			overrides: { endAvailability: { date: '2026-01-01', time: undefined }, effectiveArrival: undefined },
			detail: 'ends date',
		},
		{
			name: 'nothing without dates',
			overrides: { endAvailability: undefined, effectiveArrival: undefined },
			detail: '',
		},
	])('names the participant with $name', async ({ overrides, detail }) => {
		// Arrange
		const harness = await create(overrides as Partial<ParticipantModel>);

		// Act
		const shown = [await harness.name(), await harness.detail()];

		// Assert
		expect(shown).toEqual(['A B', detail]);
	});

	it('links to the movement form prefilled with the departure of the participant', async () => {
		// Arrange
		const harness = await create({});
		const link = await harness.link();

		// Act
		await harness.open();

		// Assert
		expect([link, openRegularization.mock.calls.length]).toEqual(['/create/REGISTERED', 1]);
	});
});
