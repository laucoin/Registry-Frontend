import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { GroupMembersBlock } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model';
import {
	CheckedChangeModel,
	GroupMembersPanelComponent,
} from '@pages/projects/[projectId]/participants/group-status-list/group-members-panel/group-members-panel.component';
import { GroupMembersPanelHarness } from '@pages/projects/[projectId]/participants/group-status-list/group-members-panel/testing/group-members-panel.harness';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const member = ParticipantMapper.toModel(PARTICIPANT_DTO);
const ROW = MonitoringRowHelper.fromParticipant(member);

const pageOf = (content: ParticipantModel[], totalElements = content.length): PageModel<ParticipantModel> => ({
	content,
	page: 0,
	size: 20,
	totalElements,
	totalPages: 1,
	hasNext: totalElements > content.length,
	lastRefresh: new Date(),
});

const block = (overrides: Partial<GroupMembersBlock> = {}): GroupMembersBlock => ({
	...PageStateHelper.initial({ resetSearch: false }),
	...overrides,
});

describe('GroupMembersPanelComponent', () => {
	let fixture: ComponentFixture<GroupMembersPanelComponent>;
	let events: string[];
	let changes: CheckedChangeModel[];

	function create(
		shown: GroupMembersBlock,
		checkedIds: ReadonlySet<string> = new Set(),
	): Promise<GroupMembersPanelHarness> {
		fixture = TestBed.createComponent(GroupMembersPanelComponent);
		fixture.componentRef.setInput('block', shown);
		fixture.componentRef.setInput('name', 'Wolves');
		fixture.componentRef.setInput('rows', shown.element?.content.length ? [ROW] : []);
		fixture.componentRef.setInput('checkedIds', checkedIds);
		fixture.componentInstance.moreRequested.subscribe(() => events.push('more'));
		fixture.componentInstance.retried.subscribe(() => events.push('retry'));
		fixture.componentInstance.checkedChange.subscribe((change) => changes.push(change));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, GroupMembersPanelHarness);
	}

	beforeEach(() => {
		events = [];
		changes = [];
		TestBed.configureTestingModule({
			imports: [TranslocoTestingModule.forRoot({ langs: { fr: {} }, translocoConfig: { defaultLang: 'fr' } })],
			providers: [{ provide: DatePipe, useValue: { transform: (): string => 'date' } }],
		});
	});

	it('shows skeleton rows while the first members load', async () => {
		// Arrange
		const harness = await create(block({ loading: true }));

		// Act
		const shown = [(await harness.skeleton()) !== null, (await harness.rows()).length];

		// Assert
		expect(shown).toEqual([true, 0]);
	});

	it.each([
		{
			name: 'that nobody of the group is on site',
			block: block({ element: pageOf([]) }),
			empty: 'fr.projectHome.groupStatus.noMembers',
		},
		{
			name: 'only the failure when the empty group failed',
			block: block({ element: pageOf([]), error: PageStateHelper.toNotification(ERROR_500) }),
			empty: undefined,
		},
	])('tells $name', async ({ block: shown, empty }) => {
		// Arrange
		const harness = await create(shown);

		// Act
		const text = await harness.empty();

		// Assert
		expect(text).toBe(empty);
	});

	it('shows a ticked row per member and offers the next members', async () => {
		// Arrange
		const harness = await create(block({ element: pageOf([member], 30) }), new Set([member.id]));

		// Act
		const rows = await harness.rows();

		// Assert
		expect([rows.length, await rows[0].checked(), (await harness.loadMore()) !== null]).toEqual([1, true, true]);
	});

	it('asks for the next members and for a new try', async () => {
		// Arrange
		const harness = await create(
			block({ element: pageOf([member], 30), error: PageStateHelper.toNotification(ERROR_500) }),
		);

		// Act
		await (await harness.loadMore())?.loadMore();
		await (await harness.error())?.retry();

		// Assert
		expect(events).toEqual(['more', 'retry']);
	});

	it('relays the tick of a member', async () => {
		// Arrange
		await create(block({ element: pageOf([member]) }));
		const checkbox: HTMLElement & { checked: boolean } = fixture.nativeElement.querySelector(
			'[data-test-id="monitoring-row-checkbox"]',
		);

		// Act
		checkbox.checked = true;
		checkbox.dispatchEvent(new Event('change'));

		// Assert
		expect(changes).toEqual([{ ids: [member.id], checked: true }]);
	});
});
