import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { DatePipe } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { TranslocoTestingModule } from '@jsverse/transloco';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { SessionFacade } from '@core/registry/state/session.facade';
import { UiFacade } from '@core/registry/state/ui.facade';
import { ParticipantFacade } from '@pages/projects/[projectId]/configuration/participants/data/state/participant.facade';
import { GroupStatusFacade } from '@pages/projects/[projectId]/participants/data/state/group-status.facade';
import { ParticipantsMonitoringPage } from '@pages/projects/[projectId]/participants/participants-monitoring.page';
import { ParticipantsMonitoringHarness } from '@pages/projects/[projectId]/participants/testing/participants-monitoring.harness';
import { SelectedProjectFacade } from '@pages/projects/data/state/selected-project/selected-project.facade';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { REFRESH_SERVICE_STUB } from '@shared/helpers/testing/refresh-service.stub';
import { GROUP_DTO, PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500 } from '@shared/helpers/testing/test-fixtures';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { ParticipantsTabEnum } from '@shared/models/enumeration/participants-tab.enum';
import { GenericModel } from '@shared/models/model/generic.model';
import { GroupModel } from '@shared/models/model/group.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';

@Component({ template: '' })
class EmptyComponent {}

const GROUP = GroupMapper.toModel({ ...GROUP_DTO, onSiteMembersCount: 1 });
const PARTICIPANT = ParticipantMapper.toModel(PARTICIPANT_DTO);

const pageOf = <T extends GenericModel>(content: T[], totalElements = content.length): PageModel<T> => ({
	content,
	page: 0,
	size: 20,
	totalElements,
	totalPages: 1,
	hasNext: false,
	lastRefresh: new Date(),
});

/** Facade dont chaque membre non précisé est lu comme un signal vide ou appelé comme une commande sans effet. */
function silentFacade(): Record<string, unknown> {
	const members: Record<string, unknown> = {};
	return new Proxy(members, {
		get: (_, key: string | symbol): unknown => {
			if (typeof key !== 'string' || key === 'then') return undefined;
			return (members[key] ??= vi.fn(() => undefined));
		},
	});
}

describe('ParticipantsMonitoringPage', () => {
	let myGroupsPage: WritableSignal<PageModel<GroupModel> | undefined>;
	let myGroupsError: WritableSignal<NotificationModel | undefined>;
	let groupsPage: WritableSignal<PageModel<GroupModel> | undefined>;
	let participantsPage: WritableSignal<PageModel<ParticipantModel> | undefined>;
	let groups: Record<string, unknown>;
	let participants: Record<string, unknown>;
	let fixture: ComponentFixture<ParticipantsMonitoringPage>;

	const calls = (facade: Record<string, unknown>, name: string): unknown[][] => (facade[name] as Mock).mock.calls;

	async function create(url = '/', settled = true): Promise<ParticipantsMonitoringHarness> {
		if (settled) {
			myGroupsPage.update((page) => page ?? pageOf([GROUP]));
			groupsPage.update((page) => page ?? pageOf([GROUP]));
			participantsPage.update((page) => page ?? pageOf([PARTICIPANT]));
		}
		await TestBed.inject(Router).navigateByUrl(url);
		fixture = TestBed.createComponent(ParticipantsMonitoringPage);
		return TestbedHarnessEnvironment.harnessForFixture(fixture, ParticipantsMonitoringHarness);
	}

	beforeEach(() => {
		myGroupsPage = signal<PageModel<GroupModel> | undefined>(undefined);
		myGroupsError = signal<NotificationModel | undefined>(undefined);
		groupsPage = signal<PageModel<GroupModel> | undefined>(undefined);
		participantsPage = signal<PageModel<ParticipantModel> | undefined>(undefined);
		groups = {
			myGroupsPage,
			groupsPage,
			myGroupsPageLoading: signal(false),
			groupsPageLoading: signal(false),
			myGroupsPageSilentLoading: signal(false),
			groupsPageSilentLoading: signal(false),
			myGroupsPageError: myGroupsError,
			groupsPageError: signal(undefined),
			fetchMyGroupsPage: vi.fn(),
			fetchGroupsPage: vi.fn(),
			fetchGroupMembersPage: vi.fn(),
			membersByGroup: signal({}),
		};
		participants = {
			participantsPage,
			participantsPageLoading: signal(false),
			participantsPageSilentLoading: signal(false),
			participantsPageError: signal(undefined),
			participantsPageResetSearch: signal(false),
			participantsPageQueryParam: signal(undefined),
			participantsPageStatusParam: signal(undefined),
			presencesStatusMetadata: signal([
				{ label: '-', value: undefined },
				{ label: 'Overdue', value: 'OVERDUE' },
			]),
			fetchParticipantsPage: vi.fn(),
			inputPageSearchParameters: vi.fn(),
		};
		TestBed.configureTestingModule({
			imports: [
				TranslocoTestingModule.forRoot({
					langs: {
						fr: {
							projectHome: {
								participantsPage: {
									checked: {
										zero: '{{ count }} ticked',
										one: '{{ count }} ticked',
										few: '{{ count }} ticked',
									},
								},
							},
							global: { list: { 'active-filters': '{{ count }}' } },
						},
					},
					translocoConfig: { availableLangs: ['fr'], defaultLang: 'fr' },
					preloadLangs: true,
				}),
			],
			providers: [
				provideRouter([{ path: '**', component: EmptyComponent }]),
				REFRESH_SERVICE_STUB,
				PluralTranslationPipe,
				{ provide: DatePipe, useValue: { transform: (): string => 'date' } },
				{ provide: UiFacade, useValue: { tinyScreen: signal(false) } },
				{ provide: SelectedProjectFacade, useValue: silentFacade() },
				{ provide: SessionFacade, useValue: silentFacade() },
				{ provide: GroupStatusFacade, useValue: groups },
				{ provide: ParticipantFacade, useValue: participants },
			],
		});
	});

	describe('the tabs', () => {
		it('shows a skeleton and no tab until every tab has settled, and asks for every first batch', async () => {
			// Arrange
			const harness = await create('/', false);

			// Act
			const shown = [await harness.loadingShown(), await harness.tabs()];

			// Assert
			expect([
				shown,
				calls(groups, 'fetchMyGroupsPage'),
				calls(groups, 'fetchGroupsPage'),
				calls(participants, 'fetchParticipantsPage'),
			]).toEqual([[true, []], [[undefined, 20]], [[undefined, 20]], [[undefined, 20]]]);
		});

		it('does not load again a tab that already holds a page', async () => {
			// Arrange
			await create();

			// Act
			const loaded = [calls(groups, 'fetchGroupsPage'), calls(participants, 'fetchParticipantsPage')];

			// Assert
			expect(loaded).toEqual([[], []]);
		});

		it('reloads the individual tab whose search was reset', async () => {
			// Arrange
			(participants['participantsPageResetSearch'] as WritableSignal<boolean>).set(true);

			// Act
			await create();

			// Assert
			expect(calls(participants, 'fetchParticipantsPage')).toEqual([[undefined, 20]]);
		});

		it.each([
			{
				name: 'my groups first, with their totals, to a user who has some',
				mine: [GROUP],
				tabs: [ParticipantsTabEnum.MINE, ParticipantsTabEnum.GROUPS, ParticipantsTabEnum.INDIVIDUAL],
				active: ParticipantsTabEnum.MINE,
			},
			{
				name: 'no tab of my groups to a user who has none',
				mine: [],
				tabs: [ParticipantsTabEnum.GROUPS, ParticipantsTabEnum.INDIVIDUAL],
				active: ParticipantsTabEnum.GROUPS,
			},
		])('offers $name', async ({ mine, tabs, active }) => {
			// Arrange
			myGroupsPage.set(pageOf(mine));
			const harness = await create();

			// Act
			const shown = await harness.tabs();

			// Assert
			expect([shown.map((tab) => tab.key), shown.map((tab) => tab.total), await harness.activeTab()]).toEqual([
				tabs,
				tabs.map((tab) => (tab === ParticipantsTabEnum.MINE ? String(mine.length) : '1')),
				active,
			]);
		});

		it.each([
			{ name: 'the tab asked in the url', url: '/?tab=individual', active: ParticipantsTabEnum.INDIVIDUAL },
			{
				name: 'the first tab when the url asks for an unknown one',
				url: '/?tab=unknown',
				active: ParticipantsTabEnum.MINE,
			},
		])('opens $name', async ({ url, active }) => {
			// Arrange
			const harness = await create(url);

			// Act
			const shown = await harness.activeTab();

			// Assert
			expect(shown).toBe(active);
		});

		it.each([
			{ name: 'keeps a newly shown tab in the url', tab: ParticipantsTabEnum.GROUPS, url: '/?tab=groups' },
			{ name: 'ignores the active tab shown again', tab: ParticipantsTabEnum.MINE, url: '/' },
			{ name: 'ignores a tab shown without a name', tab: undefined, url: '/' },
		])('$name', async ({ tab, url }) => {
			// Arrange
			const harness = await create();

			// Act
			await harness.showTab(tab);

			// Assert
			expect(TestBed.inject(Router).url).toBe(url);
		});

		it('ignores a cancelled navigation to a tab', async () => {
			// Arrange
			const harness = await create();
			const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockRejectedValue(new Error('cancelled'));

			// Act
			await harness.showTab(ParticipantsTabEnum.GROUPS);

			// Assert
			expect(navigate).toHaveBeenCalledTimes(1);
		});

		it('shows the groups of the shown tab and forwards their requests', async () => {
			// Arrange
			const harness = await create('/?tab=groups');
			const list = await harness.groups();

			// Act
			await list?.open(GROUP.id);

			// Assert
			expect(calls(groups, 'fetchGroupMembersPage').at(-1)).toEqual([GROUP.id, undefined, 20]);
		});

		it.each([
			{ name: 'my groups', tab: ParticipantsTabEnum.MINE, fetch: 'fetchMyGroupsPage' },
			{ name: 'all the groups', tab: ParticipantsTabEnum.GROUPS, fetch: 'fetchGroupsPage' },
		])('asks for the next batch of $name when their list retries', async ({ tab, fetch }) => {
			// Arrange
			(
				groups[
					tab === ParticipantsTabEnum.MINE ? 'myGroupsPageError' : 'groupsPageError'
				] as WritableSignal<unknown>
			).set(PageStateHelper.toNotification(ERROR_500));
			const harness = await create(`/?tab=${tab}`);

			// Act
			await (await (await harness.groups())?.error())?.retry();

			// Assert
			expect(calls(groups, fetch).at(-1)).toEqual([1, 20]);
		});

		it('shows the failure of my groups with the other tabs, and asks for them again', async () => {
			// Arrange
			myGroupsPage.set(undefined);
			myGroupsError.set(PageStateHelper.toNotification(ERROR_500));
			groupsPage.set(pageOf([GROUP]));
			participantsPage.set(pageOf([PARTICIPANT]));
			const harness = await create('/', false);

			// Act
			await (await harness.error())?.retry();

			// Assert
			expect([(await harness.tabs()).map((tab) => tab.key), calls(groups, 'fetchMyGroupsPage').length]).toEqual([
				[ParticipantsTabEnum.GROUPS, ParticipantsTabEnum.INDIVIDUAL],
				2,
			]);
		});
	});

	describe('the roll call', () => {
		it('counts the ticked participants and clears them all at once', async () => {
			// Arrange
			const harness = await create('/?tab=individual');
			const rollCall = await harness.rollCall();
			const before = [await rollCall.countText(), await rollCall.canUncheck()];
			const checkbox: HTMLElement & { checked: boolean } = fixture.nativeElement.querySelector(
				'[data-test-id="monitoring-row-checkbox"]',
			);
			checkbox.checked = true;
			checkbox.dispatchEvent(new Event('change'));
			const ticked = [await rollCall.countText(), await rollCall.canUncheck()];

			// Act
			await rollCall.uncheckAll();

			// Assert
			expect([before, ticked, await rollCall.countText()]).toEqual([
				['0 ticked', false],
				['1 ticked', true],
				'0 ticked',
			]);
		});

		it('ticks and unticks the members of a group', async () => {
			// Arrange
			const harness = await create();
			const list = fixture.debugElement.query((element) => element.name === 'app-group-status-list');

			// Act
			list.triggerEventHandler('checkedChange', { ids: ['a', 'b'], checked: true });
			list.triggerEventHandler('checkedChange', { ids: ['a'], checked: false });

			// Assert
			expect(await (await harness.rollCall()).countText()).toBe('1 ticked');
		});
	});

	describe('the individual tab', () => {
		it.each([
			{ name: 'the default filters when the url carries none', url: '/?tab=individual', expected: ['', ''] },
			{
				name: 'the known status carried by the url',
				url: '/?tab=individual&status=OVERDUE',
				expected: ['', 'OVERDUE'],
			},
			{
				name: 'no status for an unknown one in the url',
				url: '/?tab=individual&status=LOST',
				expected: ['', ''],
			},
		])('starts from $name', async ({ url, expected }) => {
			// Arrange
			const harness = await create(url);
			const search = await harness.search();

			// Act
			const shown = [await search?.searchedText(), await search?.chosenStatus()];

			// Assert
			expect(shown).toEqual(expected);
		});

		it('searches the typed text from the first batch and writes it next to the tab', async () => {
			// Arrange
			const harness = await create('/?tab=individual');

			// Act
			await (await harness.search())?.search('ada');

			// Assert
			expect([calls(participants, 'fetchParticipantsPage').at(-1), TestBed.inject(Router).url]).toEqual([
				[0, 20],
				'/?tab=individual&q=ada',
			]);
		});

		it('reloads the participants from the first batch when the filters of the url change', async () => {
			// Arrange
			await create('/?tab=individual');

			// Act
			await TestBed.inject(Router).navigateByUrl('/?tab=individual&q=ada');

			// Assert
			expect(calls(participants, 'fetchParticipantsPage').at(-1)).toEqual([0, 20]);
		});

		it.each([
			{ name: 'no filter', query: undefined, status: undefined, expected: undefined },
			{ name: 'a text and a status', query: 'ada', status: 'OVERDUE', expected: '2' },
		])('counts the active filters with $name', async ({ query, status, expected }) => {
			// Arrange
			(participants['participantsPageQueryParam'] as WritableSignal<unknown>).set(query);
			(participants['participantsPageStatusParam'] as WritableSignal<unknown>).set(status);
			const harness = await create('/?tab=individual');

			// Act
			const count = await (await harness.individual())?.activeFiltersText();

			// Assert
			expect(count?.trim()).toBe(expected);
		});

		it('clears the filters and searches again when the list asks to reset them', async () => {
			// Arrange
			(participants['participantsPageQueryParam'] as WritableSignal<unknown>).set('ada');
			participantsPage.set(pageOf<ParticipantModel>([]));
			const harness = await create('/?tab=individual&q=ada');

			// Act
			await (await harness.individual())?.resetFilters();

			// Assert
			expect([
				await (await harness.search())?.searchedText(),
				calls(participants, 'fetchParticipantsPage').at(-1),
			]).toEqual(['', [0, 20]]);
		});

		it('asks for the next batch when its list retries', async () => {
			// Arrange
			(participants['participantsPageError'] as WritableSignal<unknown>).set(
				PageStateHelper.toNotification(ERROR_500),
			);
			const harness = await create('/?tab=individual');

			// Act
			await (await (await harness.individual())?.error())?.retry();

			// Assert
			expect(calls(participants, 'fetchParticipantsPage').at(-1)).toEqual([1, 20]);
		});
	});

	it('titles the page', async () => {
		// Arrange
		const harness = await create();

		// Act
		const title = await harness.title();

		// Assert
		expect(title).toBe('projectHome.participantsPage.title');
	});
});
