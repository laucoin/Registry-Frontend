import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { ParticipantGroupsDialogComponent } from '@pages/projects/[projectId]/configuration/participants/participant-groups-dialog/participant-groups-dialog.component';
import { ParticipantGroupsDialogHarness } from '@pages/projects/[projectId]/configuration/participants/participant-groups-dialog/testing/participant-groups-dialog.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ParticipantModel } from '@shared/models/model/participant.model';

const PARTICIPANT = {
	id: 'pa1',
	groups: [
		{ id: 'g1', name: 'Unité' },
		{ id: 'g2', name: 'Équipe' },
	],
} as ParticipantModel;

@Component({
	imports: [ParticipantGroupsDialogComponent],
	templateUrl: './participant-groups-dialog.component.spec.html',
})
class HostComponent {
	public readonly participant = signal<ParticipantModel | undefined>(undefined);
}

describe('ParticipantGroupsDialogComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(participant?: ParticipantModel): Promise<ParticipantGroupsDialogHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.participant.set(participant);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ParticipantGroupsDialogHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
		});
	});

	it.each([
		{ name: 'stays closed without a participant', participant: undefined, expected: [false, []] },
		{
			name: 'lists the groups of the given participant',
			participant: PARTICIPANT,
			expected: [true, ['Unité', 'Équipe']],
		},
	])('$name', async ({ participant, expected }) => {
		// Arrange
		const harness = await create(participant);

		// Act
		const shown = [await harness.open(), await harness.groups()];

		// Assert
		expect(shown).toEqual(expected);
	});

	it('signals its closing by the user', async () => {
		// Arrange
		const harness = await create(PARTICIPANT);

		// Act
		await harness.hide();

		// Assert
		expect(fixture.componentInstance.participant()).toBeUndefined();
	});

	it('stays open when an element inside it hides its own panel', async () => {
		// Arrange
		await create(PARTICIPANT);
		const item: HTMLElement = fixture.debugElement.query(
			By.css(byTestId('participant-groups-dialog-group-item')),
		).nativeElement;

		// Act
		item.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));

		// Assert
		expect(fixture.componentInstance.participant()).toBe(PARTICIPANT);
	});
});
