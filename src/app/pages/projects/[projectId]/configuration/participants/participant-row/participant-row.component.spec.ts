import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { ParticipantRowComponent } from '@pages/projects/[projectId]/configuration/participants/participant-row/participant-row.component';
import { ParticipantRowHarness } from '@pages/projects/[projectId]/configuration/participants/participant-row/testing/participant-row.harness';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { ParticipantModel } from '@shared/models/model/participant.model';

const PARTICIPANT = {
	id: 'pa1',
	firstName: 'Ada',
	lastName: 'Lovelace',
	visible: true,
	status: { value: PresenceStatusEnum.IN, label: 'In' },
	groups: [{ id: 'g1', name: 'Unité' }],
	startAvailability: undefined,
	endAvailability: undefined,
} as unknown as ParticipantModel;

const TWO_GROUPS = {
	...PARTICIPANT,
	groups: [
		{ id: 'g1', name: 'Unité' },
		{ id: 'g2', name: 'Équipe' },
	],
} as ParticipantModel;

@Component({
	imports: [ParticipantRowComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './participant-row.component.spec.html',
})
class HostComponent {
	public readonly participant: WritableSignal<ParticipantModel> = signal(PARTICIPANT);
	public readonly groupId = signal<string | undefined>(undefined);
	public readonly requested: ParticipantModel[] = [];
}

describe('ParticipantRowComponent', () => {
	let fixture: ComponentFixture<HostComponent>;

	async function create(participant: ParticipantModel, groupId?: string): Promise<ParticipantRowHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.participant.set(participant);
		fixture.componentInstance.groupId.set(groupId);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(ParticipantRowHarness);
	}

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: ParticipantFacade, useValue: {} },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: ['p1_REGISTRY_PROJECT_GROUP_U'] }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm: vi.fn(), tinyScreen: signal(false) } },
				{ provide: Router, useValue: { navigateByUrl: vi.fn(() => Promise.resolve(true)), url: '/list' } },
				{ provide: DatePipe, useValue: { transform: (): string => '01/07' } },
			],
		});
	});

	it('titles a participant with the full name and shows the single group and the presence', async () => {
		// Arrange
		const harness = await create(PARTICIPANT);

		// Act
		const view = [await harness.view(), await harness.period()];

		// Assert
		expect(view).toEqual([
			{ title: 'Ada LOVELACE', initials: 'AL', description: 'Unité', tags: ['In'], disabled: false },
			null,
		]);
	});

	it('greys out a hidden participant without group and labels it as hidden', async () => {
		// Arrange
		const harness = await create({
			...PARTICIPANT,
			visible: false,
			groups: undefined,
		} as unknown as ParticipantModel);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual(
			expect.objectContaining({ description: '', disabled: true, tags: ['fr.participants.visible.false', 'In'] }),
		);
	});

	it('asks to see every group of a participant who has several', async () => {
		// Arrange
		const harness = await create(TWO_GROUPS);

		// Act
		await harness.showGroups();

		// Assert
		expect(fixture.componentInstance.requested).toEqual([TWO_GROUPS]);
	});

	it.each([
		{ name: 'a present participant in success', status: PresenceStatusEnum.IN, variant: 'success' },
		{ name: 'an absent participant as a warning', status: PresenceStatusEnum.OUT, variant: 'warning' },
		{ name: 'another status as neutral', status: PresenceStatusEnum.UNAVAILABLE, variant: 'neutral' },
	])('colours $name', async ({ status, variant }) => {
		// Arrange
		const harness = await create({ ...PARTICIPANT, status: { value: status, label: status } });

		// Act
		const shown = await harness.statusVariant();

		// Assert
		expect(shown).toBe(variant);
	});

	it.each([
		{ name: 'offers to remove a member from the shown group', groupId: 'g1', shown: true },
		{ name: 'offers no removal outside a group', groupId: undefined, shown: false },
	])('$name', async ({ groupId, shown }) => {
		// Arrange
		const harness = await create(PARTICIPANT, groupId);

		// Act
		const ids = (await (await harness.actions()).actions()).map((action) => action.id);

		// Assert
		expect(ids.includes('remove-member')).toBe(shown);
	});
});
