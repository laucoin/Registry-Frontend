import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it } from 'vitest';

import { GroupMembersBlock } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model';
import { CheckedChangeModel } from '@pages/projects/[projectId]/participants/group-status-list/group-members-panel/group-members-panel.component';
import {
	GroupMembersRequestModel,
	GroupStatusListComponent,
} from '@pages/projects/[projectId]/participants/group-status-list/group-status-list.component';
import { GroupStatusListHarness } from '@pages/projects/[projectId]/participants/group-status-list/testing/group-status-list.harness';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { GROUP_DTO, PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { GenericModel } from '@shared/models/model/generic.model';
import { GroupModel } from '@shared/models/model/group.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageEventModel } from '@shared/models/model/page-event.model';

const TRANSLATIONS = {
	projectHome: {
		groupStatus: {
			onSite: { zero: '{{ count }} on site', one: '{{ count }} on site', few: '{{ count }} on site' },
			outside: { one: '{{ count }} out', few: '{{ count }} out' },
			overdue: { one: '{{ count }} overdue', few: '{{ count }} overdue' },
			checkedOf: '{{ checked }}/{{ total }}',
		},
	},
};

const group = GroupMapper.toModel({ ...GROUP_DTO, onSiteMembersCount: 3, outMembersCount: 1, overdueMembersCount: 1 });
const quiet: GroupModel = {
	...group,
	id: 'g2',
	name: 'Quiet',
	onSiteMembersCount: undefined,
	outMembersCount: 0,
	overdueMembersCount: 0,
};
const member = ParticipantMapper.toModel(PARTICIPANT_DTO);

const pageOf = <T extends GenericModel>(content: T[], totalElements = content.length, page = 0): PageModel<T> =>
	({
		content,
		page,
		size: 20,
		totalElements,
		totalPages: 1,
		hasNext: totalElements > content.length,
		lastRefresh: new Date(),
	}) as never;

const block = (overrides: Partial<GroupMembersBlock> = {}): GroupMembersBlock => ({
	...PageStateHelper.initial({ resetSearch: false }),
	...overrides,
});

describe('GroupStatusListComponent', () => {
	let fixture: ComponentFixture<GroupStatusListComponent>;
	let requests: GroupMembersRequestModel[];
	let batches: PageEventModel[];
	let changes: CheckedChangeModel[];

	async function create(
		page: PageModel<GroupModel> | undefined,
		options: {
			loading?: boolean;
			loadingMore?: boolean;
			error?: NotificationModel;
			members?: Record<string, GroupMembersBlock>;
			checkedIds?: ReadonlySet<string>;
		} = {},
	): Promise<GroupStatusListHarness> {
		fixture = TestBed.createComponent(GroupStatusListComponent);
		fixture.componentRef.setInput('groupPage', page);
		fixture.componentRef.setInput('loading', options.loading ?? false);
		fixture.componentRef.setInput('loadingMore', options.loadingMore ?? false);
		fixture.componentRef.setInput('error', options.error);
		fixture.componentRef.setInput('membersByGroup', options.members ?? {});
		fixture.componentRef.setInput('checkedIds', options.checkedIds ?? new Set());
		fixture.componentInstance.membersRequired.subscribe((request) => requests.push(request));
		fixture.componentInstance.updateRequired.subscribe((request) => batches.push(request));
		fixture.componentInstance.checkedChange.subscribe((change) => changes.push(change));
		return TestbedHarnessEnvironment.harnessForFixture(fixture, GroupStatusListHarness);
	}

	beforeEach(() => {
		requests = [];
		batches = [];
		changes = [];
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: TRANSLATIONS },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [PluralTranslationPipe, { provide: DatePipe, useValue: { transform: (): string => 'date' } }],
		});
	});

	describe('the groups', () => {
		it('shows skeleton sections while nothing is loaded', async () => {
			// Arrange
			const harness = await create(undefined, { loading: true });

			// Act
			const shown = [await harness.loadingShown(), await harness.emptyShown()];

			// Assert
			expect(shown).toEqual([true, false]);
		});

		it('tells that no group has a member on site', async () => {
			// Arrange
			const harness = await create(pageOf<GroupModel>([]));

			// Act
			const shown = [await harness.emptyShown(), await harness.loadingShown()];

			// Assert
			expect(shown).toEqual([true, false]);
		});

		it('shows one closed section per group with its counters, the out and overdue ones only when needed', async () => {
			// Arrange
			const harness = await create(pageOf([group, quiet]));

			// Act
			const groups = await harness.groups();

			// Assert
			expect([groups, requests]).toEqual([
				[
					{
						name: group.name,
						expanded: false,
						onSite: '3 on site',
						outside: '1 out',
						overdue: '1 overdue',
						checked: undefined,
					},
					{
						name: 'Quiet',
						expanded: false,
						onSite: '0 on site',
						outside: undefined,
						overdue: undefined,
						checked: undefined,
					},
				],
				[],
			]);
		});

		it('opens the only group and asks for its members right away', async () => {
			// Arrange
			const harness = await create(pageOf([group]));

			// Act
			const [only] = await harness.groups();

			// Assert
			expect([only.expanded, requests]).toEqual([true, [{ groupId: group.id, page: undefined, size: 20 }]]);
		});

		it('keeps the groups shown with the error, and asks for the failed batch again', async () => {
			// Arrange
			const harness = await create(pageOf([group, quiet], 40), {
				error: PageStateHelper.toNotification(ERROR_500),
			});

			// Act
			await (await harness.error())?.retry();

			// Assert
			expect([(await harness.groups()).length, batches]).toEqual([2, [{ page: 1, size: 20 }]]);
		});

		it('asks for the first batch again when retrying before anything is shown', async () => {
			// Arrange
			const harness = await create(undefined, { error: PageStateHelper.toNotification(ERROR_500) });

			// Act
			await (await harness.error())?.retry();

			// Assert
			expect(batches).toEqual([{ page: 0, size: 20 }]);
		});

		it.each([
			{
				name: 'every group is shown',
				total: 2,
				loadingMore: false,
				members: {},
				shown: false,
				loading: undefined,
			},
			{ name: 'more groups exist', total: 40, loadingMore: false, members: {}, shown: true, loading: false },
			{ name: 'the next groups load', total: 40, loadingMore: true, members: {}, shown: true, loading: true },
			{
				name: 'members load',
				total: 40,
				loadingMore: false,
				members: { g1: block({ loading: true }) },
				shown: true,
				loading: true,
			},
			{
				name: 'members refresh',
				total: 40,
				loadingMore: false,
				members: { g1: block({ silentLoading: true }) },
				shown: true,
				loading: true,
			},
		])(
			'offers the next groups, busy accordingly, when $name',
			async ({ total, loadingMore, members, shown, loading }) => {
				// Arrange
				const harness = await create(pageOf([group, quiet], total), {
					loadingMore,
					members: members as Record<string, GroupMembersBlock>,
				});

				// Act
				const more = await harness.loadMore();

				// Assert
				expect([more !== null, await more?.loading()]).toEqual([shown, loading]);
			},
		);

		it('asks for the next batch of groups', async () => {
			// Arrange
			const harness = await create(pageOf([group, quiet], 40));

			// Act
			await (await harness.loadMore())?.loadMore();

			// Assert
			expect(batches).toEqual([{ page: 1, size: 20 }]);
		});
	});

	describe('the members', () => {
		it.each([
			{
				name: 'asks for the first members of a group when its section opens',
				members: {},
				expected: [{ groupId: group.id, page: undefined, size: 20 }],
			},
			{
				name: 'asks nothing for a group that already has members',
				members: { [group.id]: block({ element: pageOf([member]) }) },
				expected: [],
			},
			{
				name: 'asks nothing while the members of a group load',
				members: { [group.id]: block({ loading: true }) },
				expected: [],
			},
		])('$name', async ({ members, expected }) => {
			// Arrange
			const harness = await create(pageOf([group, quiet]), { members });

			// Act
			await harness.open(group.id);

			// Assert
			expect(requests).toEqual(expected);
		});

		it('relays the next members, the retry and the ticks of a group', async () => {
			// Arrange
			const members = { [group.id]: block({ element: pageOf([member], 30) }) };
			await create(pageOf([group, quiet]), { members });
			const panel = fixture.debugElement.query((element) => element.name === 'app-group-members-panel');

			// Act
			panel.triggerEventHandler('moreRequested');
			panel.triggerEventHandler('retried');
			panel.triggerEventHandler('checkedChange', { ids: [member.id], checked: true });

			// Assert
			expect([requests, changes]).toEqual([
				[
					{ groupId: group.id, page: 1, size: 20 },
					{ groupId: group.id, page: 1, size: 20 },
				],
				[{ ids: [member.id], checked: true }],
			]);
		});

		it('asks for the first members again when a failed group has none', async () => {
			// Arrange
			const members = { [group.id]: block({ error: PageStateHelper.toNotification(ERROR_500) }) };
			const harness = await create(pageOf([group, quiet]), { members });

			// Act
			await (await (await harness.members(group.id))?.error())?.retry();

			// Assert
			expect(requests).toEqual([{ groupId: group.id, page: undefined, size: 20 }]);
		});

		it('shows how many members of a group are ticked', async () => {
			// Arrange
			const members = { [group.id]: block({ element: pageOf([member]) }) };
			const harness = await create(pageOf([group, quiet]), { members, checkedIds: new Set([member.id]) });

			// Act
			const [first, second] = await harness.groups();

			// Assert
			expect([first.checked, second.checked]).toEqual(['1/3', undefined]);
		});
	});
});
