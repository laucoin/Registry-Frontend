import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { GroupMembersBlock } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model';
import { GROUP_DTO, PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, pageOf } from '@shared/helpers/testing/test-fixtures';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { ParticipantMapper } from '@shared/mappers/participant.mapper';
import { GroupModel } from '@shared/models/model/group.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { PageModel } from '@shared/models/model/page.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { LoadMoreComponent } from '@shared/ui/common/load-more/load-more.component';
import { CheckedChangeModel, GroupMembersRequestModel, GroupStatusListComponent } from './group-status-list.component';

const group: GroupModel = GroupMapper.toModel({ ...GROUP_DTO, membersCount: 4, onSiteMembersCount: 3, inMembersCount: 1, outMembersCount: 1, overdueMembersCount: 1 });
const quiet: GroupModel = { ...group, id: 'g2', outMembersCount: 0, overdueMembersCount: 0 };
const member: ParticipantModel = ParticipantMapper.toModel(PARTICIPANT_DTO);

function block(overrides: Partial<GroupMembersBlock> = {}): GroupMembersBlock {
	return { ...PageStateHelper.initial({ resetSearch: false }), ...overrides };
}

describe('GroupStatusListComponent', () => {
	let fixture: ComponentFixture<GroupStatusListComponent>;
	let requests: GroupMembersRequestModel[];
	let changes: CheckedChangeModel[];

	async function render(page: PageModel<GroupModel> | undefined, options: { loading?: boolean, error?: NotificationModel, members?: Record<string, GroupMembersBlock> } = {}): Promise<void> {
		fixture.componentRef.setInput('groupPage', page);
		fixture.componentRef.setInput('loading', options.loading ?? false);
		fixture.componentRef.setInput('error', options.error);
		fixture.componentRef.setInput('membersByGroup', options.members ?? {});
		await fixture.whenStable();
	}

	function openFirstGroup(): void {
		fixture.nativeElement.querySelector('sgdf-accordion-item').dispatchEvent(new CustomEvent('sgdf-after-expand'));
	}

	beforeEach(async () => {
		await MockBuilder(GroupStatusListComponent)
			.keep(LoadMoreComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key);
		fixture = TestBed.createComponent(GroupStatusListComponent);
		requests = [];
		changes = [];
		fixture.componentInstance.checkedChange.subscribe((change: CheckedChangeModel): number => changes.push(change));
		fixture.componentInstance.membersRequired.subscribe((request: GroupMembersRequestModel): number => requests.push(request));
	});

	it('should display one closed section per group without loading any member', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 });

		// Act
		const items: { expanded: boolean }[] = Array.from(fixture.nativeElement.querySelectorAll('sgdf-accordion-item'));

		// Assert
		expect(items).toHaveLength(2);
		expect(items.some((item: { expanded: boolean }): boolean => item.expanded)).toBe(false);
		expect(requests).toEqual([]);
	});

	it('should open the only group', async () => {
		// Arrange
		await render(pageOf([group]));

		// Act
		const item: { expanded: boolean } = fixture.nativeElement.querySelector('sgdf-accordion-item');

		// Assert
		expect(item.expanded).toBe(true);
	});

	it('should ask for the members of the only group without waiting for its section to announce it', async () => {
		// Arrange
		const page: PageModel<GroupModel> = pageOf([group]);

		// Act
		await render(page);

		// Assert
		expect(requests).toEqual([{ groupId: 'g1', page: undefined, size: 20 }]);
	});

	it('should keep the groups closed when the page shows one group out of several', async () => {
		// Arrange
		await render({ ...pageOf([group]), totalElements: 5, hasNext: true });

		// Act
		const item: { expanded: boolean } = fixture.nativeElement.querySelector('sgdf-accordion-item');

		// Assert
		expect(item.expanded).toBe(false);
	});

	it('should show the counters of the on-site members, and the out and overdue tags only for the groups having some', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 });

		// Act
		const tags: string[] = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag')).map((tag: HTMLElement): string => tag.textContent.trim());

		// Assert
		expect(tags.filter((tag: string): boolean => tag.includes('projectHome.groupStatus.onSite'))).toHaveLength(2);
		expect(tags.filter((tag: string): boolean => tag.includes('projectHome.groupStatus.outside'))).toHaveLength(1);
		expect(tags.filter((tag: string): boolean => tag.includes('projectHome.groupStatus.overdue'))).toHaveLength(1);
	});

	it('should ask for the first members of a group when its section opens', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 });

		// Act
		openFirstGroup();

		// Assert
		expect(requests).toEqual([{ groupId: 'g1', page: undefined, size: 20 }]);
	});

	it('should not ask again for the members of a group that already has some', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 }, { members: { g1: block({ element: pageOf([member]) }) } });

		// Act
		openFirstGroup();

		// Assert
		expect(requests).toEqual([]);
	});

	it('should not ask again while the members of a group are loading', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 }, { members: { g1: block({ loading: true }) } });

		// Act
		openFirstGroup();

		// Assert
		expect(requests).toEqual([]);
	});

	it('should display a row per loaded member', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 }, { members: { g1: block({ element: pageOf([member, { ...member, id: 'pa2' }]) }) } });

		// Act
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;

		// Assert
		expect(rows).toBe(2);
	});

	it('should display skeleton rows while the first members load', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 }, { members: { g1: block({ loading: true }) } });

		// Act
		const skeletons: number = fixture.nativeElement.querySelectorAll('sgdf-accordion-item sgdf-skeleton').length;

		// Assert
		expect(skeletons).toBeGreaterThan(0);
	});

	it('should tell that a group has no member on site', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 }, { members: { g1: block({ element: pageOf<ParticipantModel>([]) }) } });

		// Act
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.groupStatus.noMembers');
	});

	it('should ask for the next members of a group when asked to load more', async () => {
		// Arrange
		const members: PageModel<ParticipantModel> = { ...pageOf([member]), page: 0, size: 10, totalElements: 30, hasNext: true };
		await render({ ...pageOf([group, quiet]), totalElements: 2 }, { members: { g1: block({ element: members }) } });

		// Act
		fixture.nativeElement.querySelector('sgdf-accordion-item app-load-more sgdf-button').click();

		// Assert
		expect(requests).toEqual([{ groupId: 'g1', page: 1, size: 10 }]);
	});

	it('should ask for the failed members again when asked to retry', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), totalElements: 2 }, { members: { g1: block({ error: PageStateHelper.toNotification(ERROR_500) }) } });

		// Act
		ngMocks.output('sgdf-accordion-item app-section-error', 'retry').emit();

		// Assert
		expect(requests).toEqual([{ groupId: 'g1', page: undefined, size: 20 }]);
	});

	it('should display skeleton sections while nothing is loaded', async () => {
		// Arrange
		await render(undefined, { loading: true });

		// Act
		const skeletons: number = fixture.nativeElement.querySelectorAll('sgdf-skeleton').length;

		// Assert
		expect(skeletons).toBe(3);
	});

	it('should display the empty message when no group has a present member', async () => {
		// Arrange
		await render(pageOf<GroupModel>([]));

		// Act
		const text: string = fixture.nativeElement.textContent;

		// Assert
		expect(text).toContain('projectHome.groupStatus.empty.message');
	});

	it('should keep the groups shown and display the error when a batch fails', async () => {
		// Arrange
		await render(pageOf([group]), { error: PageStateHelper.toNotification(ERROR_500) });

		// Act
		const error: HTMLElement | null = fixture.nativeElement.querySelector('app-section-error');
		const sections: number = fixture.nativeElement.querySelectorAll('sgdf-accordion-item').length;

		// Assert
		expect(error).not.toBeNull();
		expect(sections).toBe(1);
	});

	it('should ask for the next batch of groups when asked to load more', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), page: 1, size: 20, totalElements: 50, hasNext: true });
		const events: PageEventModel[] = [];
		fixture.componentInstance.updateRequired.subscribe((event: PageEventModel): number => events.push(event));

		// Act
		fixture.nativeElement.querySelector('sgdf-accordion + app-load-more sgdf-button').click();

		// Assert
		expect(events).toEqual([{ page: 2, size: 20 }]);
	});

	it('should ask for the failed batch of groups again when asked to retry', async () => {
		// Arrange
		await render(pageOf([group]), { error: PageStateHelper.toNotification(ERROR_500) });
		const events: PageEventModel[] = [];
		fixture.componentInstance.updateRequired.subscribe((event: PageEventModel): number => events.push(event));

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(events).toEqual([{ page: 1, size: 10 }]);
	});

	it('should ask for the first batch again when retrying before anything is shown', async () => {
		// Arrange
		await render(undefined, { error: PageStateHelper.toNotification(ERROR_500) });
		const events: PageEventModel[] = [];
		fixture.componentInstance.updateRequired.subscribe((event: PageEventModel): number => events.push(event));

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(events).toEqual([{ page: 0, size: 20 }]);
	});

	it('should not offer to load more groups when every group is shown', async () => {
		// Arrange
		await render(pageOf([group]));

		// Act
		const loadMore: HTMLElement | null = fixture.nativeElement.querySelector('sgdf-accordion + app-load-more');

		// Assert
		expect(loadMore).toBeNull();
	});

	it('should show the groups load more button as busy while the next batch is loading', async () => {
		// Arrange
		fixture.componentRef.setInput('loadingMore', true);
		await render({ ...pageOf([group]), hasNext: true });

		// Act
		const button: { loading: boolean } = fixture.nativeElement.querySelector('sgdf-accordion + app-load-more sgdf-button');

		// Assert
		expect(button.loading).toBe(true);
	});

	it('should hold the next groups back while members are loading', async () => {
		// Arrange
		await render({ ...pageOf([group, quiet]), hasNext: true, totalElements: 50 }, { members: { g1: block({ loading: true }) } });

		// Act
		const button: { loading: boolean } = fixture.nativeElement.querySelector('sgdf-accordion + app-load-more sgdf-button');

		// Assert
		expect(button.loading).toBe(true);
	});

	describe('roll call', () => {
		const loaded: GroupMembersBlock = block({ element: pageOf([member, { ...member, id: 'pa2' }]) });
		const twoGroups: PageModel<GroupModel> = { ...pageOf([group, quiet]), totalElements: 2 };

		it('should not offer a checkbox in front of the groups', async () => {
			// Arrange
			await render(twoGroups);

			// Act
			const checkboxes: number = fixture.nativeElement.querySelectorAll('sgdf-checkbox').length;

			// Assert
			expect(checkboxes).toBe(0);
		});

		it('should show how many members of the group are checked', async () => {
			// Arrange
			fixture.componentRef.setInput('checkedIds', new Set([member.id]));
			await render(twoGroups, { members: { g1: loaded } });

			// Act
			const text: string = fixture.nativeElement.textContent;

			// Assert
			expect(text).toContain('projectHome.groupStatus.checkedOf');
		});

		it('should tell the change of the checkbox of a member', async () => {
			// Arrange
			await render(twoGroups, { members: { g1: loaded } });

			// Act
			ngMocks.output('sgdf-list-item', 'checkedChange').emit(true);

			// Assert
			expect(changes).toEqual([{ ids: [member.id], checked: true }]);
		});
	});
});
