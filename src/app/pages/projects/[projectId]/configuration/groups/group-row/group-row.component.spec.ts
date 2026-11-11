import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { GroupRowComponent } from '@pages/projects/[projectId]/configuration/groups/group-row/group-row.component';
import { GroupRowHarness } from '@pages/projects/[projectId]/configuration/groups/group-row/testing/group-row.harness';
import { defined } from '@shared/helpers/testing/defined';
import { AvailabilityStatusEnum } from '@shared/models/enumeration/availability-status.enum';
import { GroupModel } from '@shared/models/model/group.model';

const GROUP = {
	id: 'g1',
	name: 'Louveteaux bleus',
	visible: true,
	membersCount: 12,
	insideMembersCount: 9,
	outsideMembersCount: 3,
	startAvailability: { date: '2026-07-01', time: undefined },
	endAvailability: undefined,
	status: { value: AvailabilityStatusEnum.AVAILABLE, label: 'Available' },
} as unknown as GroupModel;

const BARE = {
	id: 'g2',
	name: 'Pionniers',
	visible: true,
	membersCount: 0,
	insideMembersCount: 0,
	outsideMembersCount: 0,
} as unknown as GroupModel;

@Component({
	imports: [GroupRowComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-row.component.spec.html',
})
class HostComponent {
	public readonly group: WritableSignal<GroupModel> = signal(GROUP);
}

describe('GroupRowComponent', () => {
	let fixture: ComponentFixture<HostComponent>;
	let authorities: WritableSignal<string[]>;
	let navigateByUrl: Mock<(url: string) => Promise<boolean>>;

	async function create(group: GroupModel): Promise<GroupRowHarness> {
		fixture = TestBed.createComponent(HostComponent);
		fixture.componentInstance.group.set(group);
		return TestbedHarnessEnvironment.loader(fixture).getHarness(GroupRowHarness);
	}

	beforeEach(() => {
		authorities = signal(['p1_REGISTRY_PROJECT_GROUP_R']);
		navigateByUrl = vi.fn(() => Promise.resolve(true));
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [
				{ provide: GroupFacade, useValue: {} },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ authorities: authorities() }),
						selectedProject: (): unknown => ({ id: 'p1' }),
						currentProjectId: (): string => 'p1',
					},
				},
				{ provide: UiFacade, useValue: { confirm: vi.fn(), tinyScreen: signal(false) } },
				{ provide: Router, useValue: { navigateByUrl, url: '/list' } },
				{ provide: DatePipe, useValue: { transform: (): string => '01/07' } },
			],
		});
	});

	it.each([
		{
			name: 'titles a group and describes its members and availability',
			group: GROUP,
			expected: {
				title: 'Louveteaux bleus',
				initials: 'LB',
				description: 'fr.groups.member.few (9 · 3) 01/07...',
				tags: ['Available'],
			},
		},
		{
			name: 'leaves out what a group does not have',
			group: BARE,
			expected: { title: 'Pionniers', initials: 'PI', description: 'fr.groups.member.one (0 · 0)', tags: [] },
		},
	])('$name', async ({ group, expected }) => {
		// Arrange
		const harness = await create(group);

		// Act
		const view = await harness.view();

		// Assert
		expect(view).toEqual({ ...expected, disabled: false });
	});

	it('greys out a hidden group and labels it as hidden', async () => {
		// Arrange
		const harness = await create({ ...BARE, visible: false });

		// Act
		const view = await harness.view();

		// Assert
		expect([view.disabled, view.tags]).toEqual([true, ['fr.groups.visible.false']]);
	});

	it.each([
		{ name: 'an available group in success', status: AvailabilityStatusEnum.AVAILABLE, variant: 'success' },
		{ name: 'another status as information', status: 'UNAVAILABLE', variant: 'info' },
	])('colours $name', async ({ status, variant }) => {
		// Arrange
		const harness = await create({ ...GROUP, status: { value: status, label: status } } as GroupModel);

		// Act
		const shown = await harness.statusVariant();

		// Assert
		expect(shown).toBe(variant);
	});

	it('opens the members from the primary action when it is allowed', async () => {
		// Arrange
		const harness = await create(GROUP);

		// Act
		await defined(await harness.primary()).click();

		// Assert
		expect(navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('g1'));
	});

	it('shows the primary action as unavailable to a user who cannot read the group, and does not run it', async () => {
		// Arrange
		authorities.set([]);
		const harness = await create(GROUP);
		const primary = defined(await harness.primary());

		// Act
		await primary.click();

		// Assert
		expect([await primary.disabled(), navigateByUrl.mock.calls.length]).toEqual([true, 0]);
	});
});
