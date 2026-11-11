import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe, Location } from '@angular/common';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { BehaviorSubject, NEVER, Observable, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import { GroupMemberListPage } from '@pages/projects/[projectId]/configuration/groups/group-member-list/group-member-list.page';
import {
	GroupMemberLayerEnum,
	GroupMemberListHarness,
} from '@pages/projects/[projectId]/configuration/groups/group-member-list/testing/group-member-list.harness';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { CustomDateFormatPipe } from '@shared/helpers/pipe/custom-date-format.pipe';
import { autoMock } from '@shared/helpers/testing/auto-mock';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { PresenceStatusEnum } from '@shared/models/enumeration/presence-status.enum';
import { GroupModel } from '@shared/models/model/group.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

const GROUP = { id: 'g1', name: 'Louveteaux' } as GroupModel;
const MEMBER = {
	id: 'pa1',
	firstName: 'Ada',
	lastName: 'Lovelace',
	visible: true,
	status: { value: PresenceStatusEnum.IN, label: 'In' },
	groups: [GROUP, { id: 'g2', name: 'Patrouille' }],
} as unknown as ParticipantModel;

const pageOf = (members: ParticipantModel[], hasNext = false): PageModel<ParticipantModel> => ({
	content: members,
	page: 0,
	size: 20,
	totalElements: hasNext ? 40 : members.length,
	totalPages: hasNext ? 2 : 1,
	hasNext,
	lastRefresh: new Date(),
});

const UPDATE = 'p1_REGISTRY_PROJECT_GROUP_U';
const CREATE = 'p1_REGISTRY_PROJECT_PARTICIPANT_C';

describe('GroupMemberListPage', () => {
	let fixture: ComponentFixture<GroupMemberListPage>;
	let facade: Record<string, Mock>;
	let participantFacade: Record<string, Mock>;
	let authorities: WritableSignal<string[]>;
	let query: BehaviorSubject<ParamMap>;
	let membersChange: Subject<void>;
	let participantCreated: Subject<void>;
	let participantUpdated: Subject<void>;

	const calls = (name: string): unknown[][] => facade[name].mock.calls;
	const addLayerOpened = (): boolean =>
		(
			fixture.componentInstance as unknown as { addMembersFormLayerOpened: () => boolean }
		).addMembersFormLayerOpened();
	const param = (name: string, value: unknown): void =>
		(facade[name] as unknown as WritableSignal<unknown>).set(value);

	async function create(page: PageModel<ParticipantModel> | undefined = pageOf([])): Promise<GroupMemberListHarness> {
		param('groupMembersPage', page);
		fixture = TestBed.createComponent(GroupMemberListPage);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, GroupMemberListHarness);
	}

	beforeEach(() => {
		authorities = signal([UPDATE, CREATE]);
		query = new BehaviorSubject<ParamMap>(convertToParamMap({}));
		membersChange = new Subject<void>();
		participantCreated = new Subject<void>();
		participantUpdated = new Subject<void>();
		facade = Object.assign(autoMock(undefined), {
			groupMembersPage: signal(undefined),
			groupMembersPageError: signal(undefined),
			groupMembersPageLoading: signal(false),
			groupMembersPageSilentLoading: signal(false),
			groupMembersPageQueryParam: signal(undefined),
			groupMembersPageStatusParam: signal(undefined),
			groupMembersPageIsVisibleParam: signal(undefined),
			searchedParticipantsMetadata: signal([{ label: 'Ada', value: MEMBER }]),
			fetchGroup: vi.fn(() => of(GROUP)),
			fetchGroupMembersPage: vi.fn(),
			reloadGroupMembersPage: vi.fn(),
			inputMembersPageSearchParameters: vi.fn(),
			searchParticipants: vi.fn(),
			addMembersToGroup: vi.fn(() => of({ members: [MEMBER] })),
			handleGroupMembersChange: (): Observable<void> => membersChange,
		}) as unknown as Record<string, Mock>;
		participantFacade = Object.assign(autoMock(undefined), {
			presencesStatusMetadata: signal([]),
			visibilitiesMetadata: signal([]),
			searchedUsersMetadata: signal([]),
			searchedGroupsMetadata: signal([]),
			handleParticipantFirstPageReload: (): Observable<void> => participantCreated,
			handleParticipantCurrentPageReload: (): Observable<void> => participantUpdated,
		}) as unknown as Record<string, Mock>;
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: { fr: { global: { list: { 'active-filters': '{{ count }}' } } } },
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {
						queryParamMap: query,
						get snapshot(): object {
							return { params: { groupId: 'g1' }, queryParamMap: query.value, url: [] };
						},
					},
				},
				{
					provide: Router,
					useValue: {
						navigate: vi.fn(() => Promise.resolve(true)),
						navigateByUrl: vi.fn(() => Promise.resolve(true)),
						url: '/',
						events: NEVER,
					},
				},
				{ provide: Location, useValue: { back: vi.fn() } },
				REFRESH_SERVICE_STUB,
				{ provide: GroupFacade, useValue: facade },
				{ provide: ParticipantFacade, useValue: participantFacade },
				{
					provide: SessionFacade,
					useValue: {
						currentUser: (): unknown => ({ id: 'u1', authorities: authorities() }),
						selectedProject: signal({ id: 'p1' }),
						currentProjectId: signal('p1'),
					},
				},
				{ provide: UiFacade, useValue: { tinyScreen: signal(false), confirm: vi.fn() } },
				{ provide: CustomDateFormatPipe, useValue: { transform: (): string => 'date' } },
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
			],
		});
	});

	describe('group and members', () => {
		it('titles the page after the group and loads its members filtered by the url', async () => {
			// Arrange
			query.next(convertToParamMap({ q: 'ada' }));
			const harness = await create();

			// Act
			const title = await harness.title();

			// Assert
			expect([
				title,
				calls('fetchGroup'),
				calls('inputMembersPageSearchParameters')[0],
				calls('fetchGroupMembersPage'),
			]).toEqual([
				'Louveteaux',
				[['g1']],
				['ada', undefined, undefined, undefined],
				[['g1', undefined, undefined]],
			]);
		});

		it('shows a skeleton until the group is loaded', async () => {
			// Arrange
			facade['fetchGroup'] = vi.fn(() => NEVER);
			const harness = await create();

			// Act
			const title = await harness.title();

			// Assert
			expect(title).toBeUndefined();
		});

		it('loads the group again when its members change', async () => {
			// Arrange
			await create();

			// Act
			membersChange.next();

			// Assert
			expect(calls('fetchGroup')).toEqual([['g1'], ['g1']]);
		});

		it.each([
			{
				name: 'reloads the first batch after a member is created',
				events: (): Subject<void> => participantCreated,
				reload: 'fetchGroupMembersPage',
				args: ['g1', 0, undefined],
			},
			{
				name: 'reloads the shown batches after a member changes',
				events: (): Subject<void> => participantUpdated,
				reload: 'reloadGroupMembersPage',
				args: ['g1'],
			},
		])('$name', async ({ events, reload, args }) => {
			// Arrange
			await create();

			// Act
			events().next();

			// Assert
			expect(calls(reload).at(-1)).toEqual(args);
		});

		it('searches by itself with the typed text once the debounce elapsed', async () => {
			// Arrange
			vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'Date'] });
			const harness = await create();

			// Act
			await (await harness.search()).search('lovelace');
			vi.advanceTimersByTime(400);
			vi.useRealTimers();
			await harness.title();

			// Assert
			expect((TestBed.inject(Router).navigate as Mock).mock.calls.at(-1)?.[1].queryParams).toEqual(
				expect.objectContaining({ q: 'lovelace' }),
			);
		});

		it('clears the filters and searches again when the list asks to reset them', async () => {
			// Arrange
			param('groupMembersPageQueryParam', 'ada');
			const harness = await create();

			// Act
			await (await harness.list()).resetFilters();

			// Assert
			expect([await (await harness.search()).searchedText(), calls('fetchGroupMembersPage').at(-1)]).toEqual([
				'',
				['g1', 0, undefined],
			]);
		});

		it('shows the members and asks for the next batch when the list asks for it', async () => {
			// Arrange
			const harness = await create(pageOf([MEMBER], true));

			// Act
			await (await (await harness.list()).loadMore())?.loadMore();

			// Assert
			expect([(await harness.rows()).length, calls('fetchGroupMembersPage').at(-1)]).toEqual([1, ['g1', 1, 20]]);
		});

		it('lists every group of a member in the dialog until it is closed', async () => {
			// Arrange
			const harness = await create(pageOf([MEMBER]));
			const [row] = await harness.rows();
			await row.showGroups();
			const dialog = await harness.groupsDialog();
			const groups = await dialog.groups();

			// Act
			await dialog.hide();

			// Assert
			expect([groups, await dialog.groups()]).toEqual([['Louveteaux', 'Patrouille'], []]);
		});
	});

	describe('adding and creating members', () => {
		it.each([
			{
				name: 'both to a user who updates groups and creates participants',
				granted: [UPDATE, CREATE],
				shown: [GroupMemberLayerEnum.ADD_MEMBERS, GroupMemberLayerEnum.CREATE_MEMBER],
			},
			{
				name: 'only the addition to a user who updates groups',
				granted: [UPDATE],
				shown: [GroupMemberLayerEnum.ADD_MEMBERS],
			},
			{ name: 'neither to a user who cannot update the group', granted: [CREATE], shown: [] },
		])('offers $name', async ({ granted, shown }) => {
			// Arrange
			authorities.set(granted);
			const harness = await create();

			// Act
			const actions = await harness.actions();

			// Assert
			expect(actions).toEqual(shown);
		});

		it('opens the addition with an empty selection and searches the participants', async () => {
			// Arrange
			const harness = await create();
			await harness.open(GroupMemberLayerEnum.ADD_MEMBERS);

			// Act
			await (await (await harness.members()).selection()).search('ada');

			// Assert
			expect([await harness.opened(GroupMemberLayerEnum.ADD_MEMBERS), calls('searchParticipants')]).toEqual([
				true,
				[['ada']],
			]);
		});

		it('does not add an empty selection', async () => {
			// Arrange
			const harness = await create();
			await harness.open(GroupMemberLayerEnum.ADD_MEMBERS);

			// Act
			await harness.addMembers();

			// Assert
			expect(calls('addMembersToGroup')).toEqual([]);
		});

		it('adds the chosen members to the group, then closes the addition', async () => {
			// Arrange
			const harness = await create();
			await harness.open(GroupMemberLayerEnum.ADD_MEMBERS);
			await (await (await harness.members()).selection()).choose('pa1');

			// Act
			await harness.addMembers();

			// Assert
			expect([calls('addMembersToGroup'), addLayerOpened()]).toEqual([[['g1', ['pa1']]], false]);
		});

		it('closes the addition when it is cancelled', async () => {
			// Arrange
			const harness = await create();
			await harness.open(GroupMemberLayerEnum.ADD_MEMBERS);

			// Act
			await (await harness.addActions()).cancel();

			// Assert
			expect(addLayerOpened()).toBe(false);
		});

		it('opens the creation form in the group and closes it once the member is created', async () => {
			// Arrange
			const harness = await create();
			await harness.open(GroupMemberLayerEnum.CREATE_MEMBER);
			const shown = (await harness.memberForm()) !== null;

			// Act
			participantCreated.next();

			// Assert
			expect([shown, (await harness.memberForm()) !== null]).toEqual([true, false]);
		});

		it.each([
			{ name: 'closes a layer hidden by itself', fromInside: false, opened: false },
			{
				name: 'keeps a layer open when an element inside it hides its own panel',
				fromInside: true,
				opened: true,
			},
		])('$name', async ({ fromInside, opened }) => {
			// Arrange
			const harness = await create();
			await harness.open(GroupMemberLayerEnum.ADD_MEMBERS);

			// Act
			if (fromInside) {
				const inner: HTMLElement = fixture.debugElement.query(
					By.css(byTestId('group-member-list-add-members-form')),
				).nativeElement;
				inner.dispatchEvent(new Event('sgdf-hide', { bubbles: true }));
			} else await harness.hide(GroupMemberLayerEnum.ADD_MEMBERS);

			// Assert
			expect(addLayerOpened()).toBe(opened);
		});
	});

	it('stops listening to the member changes once destroyed', async () => {
		// Arrange
		await create();
		fixture.destroy();

		// Act
		membersChange.next();

		// Assert
		expect(calls('fetchGroup')).toHaveLength(1);
	});
});
