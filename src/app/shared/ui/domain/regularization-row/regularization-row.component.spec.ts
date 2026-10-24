import type { Mock } from 'vitest';
import { signal } from '@angular/core';
import { MovementPrefillService } from '@pages/projects/[projectId]/movements/movement-form/shared/movement-prefill.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder } from 'ng-mocks';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { IntervalPipe } from '@shared/helpers/pipe/interval.pipe';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { RegularizationRowComponent } from './regularization-row.component';

function participant(withEnd: boolean): ParticipantModel {
	return {
		...ParticipantMapper.toModel(PARTICIPANT_DTO),
		endAvailability: withEnd ? { date: '2026-07-16', time: undefined } : undefined,
		effectiveArrival: new Date(Date.now() - 2 * 24 * 3600 * 1000),
	};
}

describe('RegularizationRowComponent', () => {
	let fixture: ComponentFixture<RegularizationRowComponent>;
	const openRegularization: Mock<(value: unknown) => void> = vi.fn();

	async function render(value: ParticipantModel): Promise<string> {
		fixture.componentRef.setInput('participant', value);
		await fixture.whenStable();
		return fixture.nativeElement.textContent;
	}

	beforeEach(async () => {
		await MockBuilder(RegularizationRowComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(CustomDateFormatPipe, (): string => '16 juillet')
			.mock(IntervalPipe, (): string => '2 jours')
			.mock(MovementPrefillService, { canCreate: signal(true), openRegularization });
		openRegularization.mockClear();
		fixture = TestBed.createComponent(RegularizationRowComponent);
	});

	it('should show the name, the planned end and how long the participant has been present', async () => {
		// Arrange
		const value: ParticipantModel = participant(true);

		// Act
		const text: string = await render(value);

		// Assert
		expect(text).toContain(value.firstName);
		expect(text).toContain('projectHome.participantRegularization.plannedEnd');
		expect(text).toContain('projectHome.participantRegularization.presentSince');
	});

	it('should show only the presence duration when the participant has no own planned end', async () => {
		// Arrange
		const value: ParticipantModel = participant(false);

		// Act
		const text: string = await render(value);

		// Assert
		expect(text).not.toContain('projectHome.participantRegularization.plannedEnd');
		expect(text).toContain('projectHome.participantRegularization.presentSince');
	});

	it('should open the movement form prefilled with the participant when clicked', async () => {
		// Arrange
		const value: ParticipantModel = participant(true);
		await render(value);

		// Act
		fixture.nativeElement.click();

		// Assert
		expect(openRegularization).toHaveBeenCalledWith(value);
	});
});
