import {
	Component,
	computed,
	CUSTOM_ELEMENTS_SCHEMA,
	effect,
	input,
	InputSignal,
	output,
	OutputEmitterRef,
	Signal,
	untracked,
} from '@angular/core';

import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';

import { GroupMembersBlock } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model';
import { EllipsisDirective } from '@shared/directives/ellipsis.directive';
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper';
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { GroupModel } from '@shared/models/model/group.model';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model';
import { NotificationModel } from '@shared/models/model/notification.model';
import { PageModel } from '@shared/models/model/page.model';
import { PageEventModel } from '@shared/models/model/page-event.model';
import { ParticipantModel } from '@shared/models/model/participant.model';
import { LoadMoreComponent } from '@shared/ui/common/load-more/load-more.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component';
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component';

import '@sgdf/ui/accordion';
import '@sgdf/ui/accordion-item';
import '@sgdf/ui/button';
import '@sgdf/ui/callout';
import '@sgdf/ui/list';
import '@sgdf/ui/list-item';
import '@sgdf/ui/skeleton';
import '@sgdf/ui/tag';

const DEFAULT_PAGE_SIZE = 20;
const MEMBERS_PAGE_SIZE = 20;
const SKELETON_ROWS = 3;
const MEMBER_SKELETON_ROWS = 2;

export interface CheckedChangeModel {
	ids: string[];
	checked: boolean;
}

export interface GroupMembersRequestModel {
	groupId: string;
	page: number | undefined;
	size: number;
}

/**
 * Purpose: Liste les groupes avec les compteurs de présence de leurs membres sur site, les membres étant affichés à l'ouverture d'un groupe.
 * Scope: Affiche une section d'accordéon par groupe, fermée sauf s'il est le seul groupe, ainsi que les états de chargement, d'erreur, de vide et de « charger plus » d'une liste chargée paresseusement, et demande les membres d'un groupe à l'ouverture de sa section ainsi que leurs lots suivants. Montre l'état coché des membres, pour compter les participants pendant un appel, et combien de chaque groupe sont cochés.
 * Limits: Ne possède aucune donnée et ne récupère rien ; la page décide de ce que fait une demande, redonne les membres qu'elle a chargés et garde les participants cochés. Les groupes attendent pendant le chargement d'un lot de membres.
 */
@Component({
	selector: 'app-group-status-list',
	imports: [
		SkeletonListComponent,
		EllipsisDirective,
		TranslocoPipe,
		PluralTranslationPipe,
		SectionErrorComponent,
		MonitoringRowComponent,
		LoadMoreComponent,
	],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-status-list.component.html',
})
export class GroupStatusListComponent {
	public readonly groupPage: InputSignal<PageModel<GroupModel> | undefined> = input.required();
	public readonly loading: InputSignal<boolean> = input.required();
	public readonly loadingMore = input(false);
	public readonly error: InputSignal<NotificationModel | undefined> = input.required();
	public readonly membersByGroup: InputSignal<Record<string, GroupMembersBlock>> = input({});
	public readonly checkedIds = input<ReadonlySet<string>>(new Set());

	public readonly updateRequired: OutputEmitterRef<PageEventModel> = output();
	public readonly membersRequired: OutputEmitterRef<GroupMembersRequestModel> = output();
	public readonly checkedChange: OutputEmitterRef<CheckedChangeModel> = output();

	protected readonly skeletonRows: readonly number[] = Array.from({ length: SKELETON_ROWS }, (_, index) => index);
	protected readonly memberSkeletonRows: number = MEMBER_SKELETON_ROWS;

	protected readonly size: Signal<number> = computed((): number => this.groupPage()?.size ?? DEFAULT_PAGE_SIZE);
	protected readonly hasMore = computed(() => CumulativePageHelper.hasMore(this.groupPage()));
	protected readonly isEmpty = computed(() => this.groupPage()?.content.length === 0 && !this.loading());
	protected readonly showSkeleton: Signal<boolean> = computed(
		(): boolean => this.loading() && !this.groupPage()?.content.length,
	);
	protected readonly onlyGroup = computed(() => this.groupPage()?.totalElements === 1);
	protected readonly membersLoading = computed(() =>
		Object.values(this.membersByGroup()).some(
			(block: GroupMembersBlock): boolean => block.loading || block.silentLoading,
		),
	);

	private readonly rowsByGroup: Signal<Record<string, MonitoringRowModel[]>> = computed(
		(): Record<string, MonitoringRowModel[]> =>
			Object.fromEntries(
				Object.entries(this.membersByGroup()).map(
					([groupId, block]: [string, GroupMembersBlock]): [string, MonitoringRowModel[]] => [
						groupId,
						(block.element?.content ?? []).map((member: ParticipantModel) =>
							MonitoringRowHelper.fromParticipant(member),
						),
					],
				),
			),
	);
	private readonly checkedCountByGroup: Signal<Record<string, number>> = computed((): Record<string, number> =>
		Object.fromEntries(
			Object.entries(this.rowsByGroup()).map(
				([groupId, rows]: [string, MonitoringRowModel[]]): [string, number] => [
					groupId,
					rows.filter((row: MonitoringRowModel) => this.checkedIds().has(row.id)).length,
				],
			),
		),
	);

	constructor() {
		// Une section ouverte par `expanded` ne s'annonce pas : le seul groupe demande ses membres dès qu'il est affiché.
		effect(() => {
			const page: PageModel<GroupModel> | undefined = this.groupPage();
			if (page?.totalElements === 1 && page.content[0]) {
				untracked(() => this.opened(page.content[0]));
			}
		});
	}

	protected checkedCount(group: GroupModel): number {
		return this.checkedCountByGroup()[group.id] ?? 0;
	}

	protected rowCheckedChange(id: string, checked: boolean): void {
		this.checkedChange.emit({ ids: [id], checked });
	}

	protected members(group: GroupModel): GroupMembersBlock | undefined {
		return this.membersByGroup()[group.id];
	}

	protected rows(group: GroupModel): MonitoringRowModel[] {
		return this.rowsByGroup()[group.id] ?? [];
	}

	protected hasMoreMembers(group: GroupModel): boolean {
		return CumulativePageHelper.hasMore(this.members(group)?.element);
	}

	protected opened(group: GroupModel): void {
		const block = this.members(group);
		if (!block?.element && !block?.loading) {
			this.membersRequired.emit({ groupId: group.id, page: undefined, size: MEMBERS_PAGE_SIZE });
		}
	}

	protected loadMoreMembers(group: GroupModel): void {
		const shown = this.members(group)?.element;
		this.membersRequired.emit({
			groupId: group.id,
			page: (shown?.page ?? -1) + 1,
			size: shown?.size ?? MEMBERS_PAGE_SIZE,
		});
	}

	protected retryMembers(group: GroupModel): void {
		const shown = this.members(group)?.element;
		this.membersRequired.emit({
			groupId: group.id,
			page: shown ? shown.page + 1 : undefined,
			size: shown?.size ?? MEMBERS_PAGE_SIZE,
		});
	}

	protected loadMore(): void {
		this.updateRequired.emit({ page: (this.groupPage()?.page ?? -1) + 1, size: this.size() });
	}

	protected retry(): void {
		const shown: PageModel<GroupModel> | undefined = this.groupPage();
		this.updateRequired.emit({ page: shown ? shown.page + 1 : 0, size: this.size() });
	}
}
