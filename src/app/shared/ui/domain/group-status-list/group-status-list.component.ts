import '@sgdf/ui/accordion'
import '@sgdf/ui/accordion-item'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/tag'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, input, InputSignal, output, OutputEmitterRef, Signal, untracked } from '@angular/core'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { GroupMembersBlock } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { GroupModel } from '@shared/models/model/group.model'
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { LoadMoreComponent } from '@shared/ui/common/load-more/load-more.component'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component'

const DEFAULT_PAGE_SIZE: number = 20;
const MEMBERS_PAGE_SIZE: number = 20;
const SKELETON_ROWS: number = 3;
const MEMBER_SKELETON_ROWS: number = 2;

export interface CheckedChangeModel {
	ids: string[]
	checked: boolean
}

export interface GroupMembersRequestModel {
	groupId: string
	page: number | undefined
	size: number
}

/**
 * Purpose: Lists the groups with the presence counters of their on-site members, the members being shown when a group is opened.
 * Scope: Renders one accordion section per group, closed unless it is the only group, plus the loading, error, empty and load more states of a lazily loaded list, and asks for the members of a group when its section opens and for their next batches. Shows the checked state of the members, to count the participants during a roll call, and how many of each group are checked.
 * Limits: Owns no data and fetches nothing; the page decides what a request does, gives back the members it loaded and keeps the checked participants. The groups wait while a batch of members is loading.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-group-status-list',
	imports: [TranslocoPipe, PluralTranslationPipe, SectionErrorComponent, MonitoringRowComponent, LoadMoreComponent],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-status-list.component.html',
})
export class GroupStatusListComponent {
	public readonly groupPage: InputSignal<PageModel<GroupModel> | undefined> = input.required()
	public readonly loading: InputSignal<boolean> = input.required()
	public readonly loadingMore: InputSignal<boolean> = input(false)
	public readonly error: InputSignal<NotificationModel | undefined> = input.required()
	public readonly membersByGroup: InputSignal<Record<string, GroupMembersBlock>> = input({})
	public readonly checkedIds: InputSignal<ReadonlySet<string>> = input<ReadonlySet<string>>(new Set())

	public readonly updateRequired: OutputEmitterRef<PageEventModel> = output()
	public readonly membersRequired: OutputEmitterRef<GroupMembersRequestModel> = output()
	public readonly checkedChange: OutputEmitterRef<CheckedChangeModel> = output()

	protected readonly skeletonRows: readonly number[] = Array.from({ length: SKELETON_ROWS }, (_: unknown, index: number): number => index)
	protected readonly memberSkeletonRows: readonly number[] = Array.from({ length: MEMBER_SKELETON_ROWS }, (_: unknown, index: number): number => index)

	protected readonly size: Signal<number> = computed((): number => this.groupPage()?.size ?? DEFAULT_PAGE_SIZE)
	protected readonly hasMore: Signal<boolean> = computed((): boolean => CumulativePageHelper.hasMore(this.groupPage()))
	protected readonly isEmpty: Signal<boolean> = computed((): boolean => this.groupPage()?.content.length === 0 && !this.loading())
	protected readonly showSkeleton: Signal<boolean> = computed((): boolean => this.loading() && !this.groupPage()?.content.length)
	protected readonly onlyGroup: Signal<boolean> = computed((): boolean => this.groupPage()?.totalElements === 1)
	protected readonly membersLoading: Signal<boolean> = computed((): boolean =>
		Object.values(this.membersByGroup()).some((block: GroupMembersBlock): boolean => block.loading || block.silentLoading))

	public constructor() {
		// A section opened by `expanded` does not announce itself: the only group asks for its members as soon as it is shown.
		effect((): void => {
			const page: PageModel<GroupModel> | undefined = this.groupPage();
			if (page?.totalElements === 1 && page.content[0]) {
				untracked((): void => this.opened(page.content[0]));
			}
		});
	}

	protected checkedCount(group: GroupModel): number {
		return this.loadedIds(group).filter((id: string): boolean => this.checkedIds().has(id)).length;
	}

	protected rowCheckedChange(id: string, checked: boolean): void {
		this.checkedChange.emit({ ids: [id], checked });
	}

	private loadedIds(group: GroupModel): string[] {
		return (this.members(group)?.element?.content ?? []).map((member: ParticipantModel): string => member.id);
	}

	protected members(group: GroupModel): GroupMembersBlock | undefined {
		return this.membersByGroup()[group.id]
	}

	protected rows(group: GroupModel): MonitoringRowModel[] {
		return (this.members(group)?.element?.content ?? []).map((member: ParticipantModel): MonitoringRowModel => MonitoringRowHelper.fromParticipant(member))
	}

	protected hasMoreMembers(group: GroupModel): boolean {
		return CumulativePageHelper.hasMore(this.members(group)?.element)
	}

	protected opened(group: GroupModel): void {
		const block: GroupMembersBlock | undefined = this.members(group)
		if (!block?.element && !block?.loading) {
			this.membersRequired.emit({ groupId: group.id, page: undefined, size: MEMBERS_PAGE_SIZE })
		}
	}

	protected loadMoreMembers(group: GroupModel): void {
		this.membersRequired.emit({ groupId: group.id, page: (this.members(group)?.element?.page ?? -1) + 1, size: this.members(group)?.element?.size ?? MEMBERS_PAGE_SIZE })
	}

	protected retryMembers(group: GroupModel): void {
		const shown: PageModel<ParticipantModel> | undefined = this.members(group)?.element
		this.membersRequired.emit({ groupId: group.id, page: shown ? shown.page + 1 : undefined, size: shown?.size ?? MEMBERS_PAGE_SIZE })
	}

	protected loadMore(): void {
		this.updateRequired.emit({ page: (this.groupPage()?.page ?? -1) + 1, size: this.size() })
	}

	protected retry(): void {
		const shown: PageModel<GroupModel> | undefined = this.groupPage()
		this.updateRequired.emit({ page: shown ? shown.page + 1 : 0, size: this.size() })
	}
}
