import '@sgdf/ui/accordion'
import '@sgdf/ui/accordion-item'
import '@sgdf/ui/button'
import '@sgdf/ui/callout'
import '@sgdf/ui/list'
import '@sgdf/ui/list-item'
import '@sgdf/ui/skeleton'
import '@sgdf/ui/tag'
import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core'
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco'
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper'
import { MonitoringRowHelper } from '@shared/helpers/monitoring-row.helper'
import { PluralTranslationPipe } from '@shared/helpers/pipe/plural-translation.pipe'
import { GroupModel } from '@shared/models/model/group.model'
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model'
import { NotificationModel } from '@shared/models/model/notification.model'
import { PageEventModel } from '@shared/models/model/page-event.model'
import { PageModel } from '@shared/models/model/page.model'
import { ParticipantModel } from '@shared/models/model/participant.model'
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component'
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component'

const DEFAULT_PAGE_SIZE: number = 20
const SKELETON_ROWS: number = 3

/**
 * Purpose: Lists the presence status of the participants ranged by group.
 * Scope: Renders one accordion section per group with its members, plus the loading, error, empty and load more states of a lazily loaded list.
 * Limits: A group has no status of its own, only counters derived from its members; it owns no data and the page decides what a request does.
 */
@Component({
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-group-status-list',
	imports: [TranslocoPipe, PluralTranslationPipe, SectionErrorComponent, MonitoringRowComponent],
	providers: [provideTranslocoScope('project-home')],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-status-list.component.html',
})
export class GroupStatusListComponent {
	public readonly groupPage: InputSignal<PageModel<GroupModel> | undefined> = input.required()
	public readonly loading: InputSignal<boolean> = input.required()
	public readonly loadingMore: InputSignal<boolean> = input(false)
	public readonly error: InputSignal<NotificationModel | undefined> = input.required()
	public readonly expanded: InputSignal<boolean> = input(false)

	public readonly updateRequired: OutputEmitterRef<PageEventModel> = output()

	protected readonly skeletonRows: readonly number[] = Array.from({ length: SKELETON_ROWS }, (_: unknown, index: number): number => index)

	protected readonly size: Signal<number> = computed((): number => this.groupPage()?.size ?? DEFAULT_PAGE_SIZE)
	protected readonly hasMore: Signal<boolean> = computed((): boolean => CumulativePageHelper.hasMore(this.groupPage()))
	protected readonly isEmpty: Signal<boolean> = computed((): boolean => this.groupPage()?.content.length === 0 && !this.loading())
	protected readonly showSkeleton: Signal<boolean> = computed((): boolean => this.loading() && !this.groupPage()?.content.length)

	protected rows(group: GroupModel): MonitoringRowModel[] {
		return (group.members ?? []).map((member: ParticipantModel): MonitoringRowModel => MonitoringRowHelper.fromParticipant(member))
	}

	protected loadMore(): void {
		this.updateRequired.emit({ page: (this.groupPage()?.page ?? -1) + 1, size: this.size() })
	}

	protected retry(): void {
		const shown: PageModel<GroupModel> | undefined = this.groupPage()
		this.updateRequired.emit({ page: shown ? shown.page + 1 : 0, size: this.size() })
	}
}
