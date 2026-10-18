import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoPipe } from '@jsverse/transloco';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { GROUP_DTO, PARTICIPANT_DTO } from '@shared/helpers/testing/response-fixtures';
import { ERROR_500, pageOf } from '@shared/helpers/testing/test-fixtures';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { GroupMapper } from '@shared/mappers/group.mapper';
import { GroupModel } from '@shared/models/model/group.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageStateHelper } from '@shared/helpers/store/page-state.helper';
import { GroupStatusListComponent } from './group-status-list.component';

const group: GroupModel = GroupMapper.toModel({ ...GROUP_DTO, membersCount: 2, outsideMembersCount: 1, members: [PARTICIPANT_DTO, { ...PARTICIPANT_DTO, id: 'pa2' }] });
const quiet: GroupModel = { ...group, id: 'g2', outsideMembersCount: 0 };

describe('GroupStatusListComponent', () => {
	let fixture: ComponentFixture<GroupStatusListComponent>;

	async function render(page: PageModel<GroupModel> | undefined, options: { loading?: boolean, error?: NotificationModel } = {}): Promise<void> {
		fixture.componentRef.setInput('groupPage', page);
		fixture.componentRef.setInput('loading', options.loading ?? false);
		fixture.componentRef.setInput('error', options.error);
		await fixture.whenStable();
	}

	beforeEach(async () => {
		await MockBuilder(GroupStatusListComponent)
			.mock(TranslocoPipe, (key: string): string => key)
			.mock(PluralTranslationPipe, (key: string): string => key);
		fixture = TestBed.createComponent(GroupStatusListComponent);
	});

	it('should display one section per group with a row per member', async () => {
		// Arrange
		await render(pageOf([group, quiet]));

		// Act
		const sections: number = fixture.nativeElement.querySelectorAll('sgdf-accordion-item').length;
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;

		// Assert
		expect(sections).toBe(2);
		expect(rows).toBe(4);
	});

	it('should warn about the members outside only for the groups having some', async () => {
		// Arrange
		await render(pageOf([group, quiet]));

		// Act
		const outsideTags: number = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('sgdf-tag'))
			.filter((tag: HTMLElement): boolean => tag.textContent.includes('projectHome.groupStatus.outside')).length;

		// Assert
		expect(outsideTags).toBe(1);
	});

	it('should expand the sections on demand', async () => {
		// Arrange
		fixture.componentRef.setInput('expanded', true);
		await render(pageOf([group]));

		// Act
		const item: { expanded: boolean } = fixture.nativeElement.querySelector('sgdf-accordion-item');

		// Assert
		expect(item.expanded).toBe(true);
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

	it('should ask for the next batch when asked to load more', async () => {
		// Arrange
		await render({ ...pageOf([group]), page: 1, size: 20, totalElements: 50, hasNext: true });
		const requests: PageEventModel[] = [];
		fixture.componentInstance.updateRequired.subscribe((event: PageEventModel): number => requests.push(event));

		// Act
		fixture.nativeElement.querySelector('div > sgdf-button').click();

		// Assert
		expect(requests).toEqual([{ page: 2, size: 20 }]);
	});

	it('should ask for the failed batch again when asked to retry', async () => {
		// Arrange
		await render(pageOf([group]), { error: PageStateHelper.toNotification(ERROR_500) });
		const requests: PageEventModel[] = [];
		fixture.componentInstance.updateRequired.subscribe((event: PageEventModel): number => requests.push(event));

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(requests).toEqual([{ page: 1, size: 10 }]);
	});

	it('should ask for the first batch again when retrying before anything is shown', async () => {
		// Arrange
		await render(undefined, { error: PageStateHelper.toNotification(ERROR_500) });
		const requests: PageEventModel[] = [];
		fixture.componentInstance.updateRequired.subscribe((event: PageEventModel): number => requests.push(event));

		// Act
		ngMocks.output('app-section-error', 'retry').emit();

		// Assert
		expect(requests).toEqual([{ page: 0, size: 20 }]);
	});

	it('should not offer to load more when every group is shown', async () => {
		// Arrange
		await render(pageOf([group]));

		// Act
		const button: HTMLElement | null = fixture.nativeElement.querySelector('div > sgdf-button');

		// Assert
		expect(button).toBeNull();
	});

	it('should show the load more button as busy while the next batch is loading', async () => {
		// Arrange
		fixture.componentRef.setInput('loadingMore', true);
		await render({ ...pageOf([group]), hasNext: true });

		// Act
		const button: { loading: boolean } = fixture.nativeElement.querySelector('div > sgdf-button');

		// Assert
		expect(button.loading).toBe(true);
	});

	it('should display a group without members as an empty section', async () => {
		// Arrange
		await render(pageOf([{ ...group, members: undefined }]));

		// Act
		const rows: number = fixture.nativeElement.querySelectorAll('sgdf-list-item').length;

		// Assert
		expect(rows).toBe(0);
	});
});
