import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import { GroupMembersBlock } from '@pages/projects/[projectId]/participants/data/model/group-status-store.model';
import { CumulativePageHelper } from '@shared/helpers/store/cumulative-page.helper';
import { MonitoringRowModel } from '@shared/models/model/monitoring-row.model';
import { LoadMoreComponent } from '@shared/ui/common/load-more/load-more.component';
import { SectionErrorComponent } from '@shared/ui/common/section-error/section-error.component';
import { SkeletonListComponent } from '@shared/ui/common/skeleton-list/skeleton-list.component';
import { MonitoringRowComponent } from '@shared/ui/domain/monitoring-row/monitoring-row.component';

import '@sgdf/ui/list';
import '@sgdf/ui/list-item';

const MEMBER_SKELETON_ROWS = 2;

export interface CheckedChangeModel {
	ids: string[];
	checked: boolean;
}

/**
 * Objectif: Membres sur site d'un groupe ouvert du suivi des participants.
 * Périmètre: Affiche le chargement, l'échec, l'absence de membre ou les lignes cochables des membres, et demande la
 * suite de la liste ou une nouvelle tentative.
 * Limites: Ne récupère rien et ne garde aucune coche ; la liste des groupes relaie les demandes et les coches.
 */
@Component({
	selector: 'app-group-members-panel',
	imports: [TranslocoPipe, SkeletonListComponent, SectionErrorComponent, MonitoringRowComponent, LoadMoreComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './group-members-panel.component.html',
})
export class GroupMembersPanelComponent {
	public readonly block = input.required<GroupMembersBlock>();
	public readonly name = input.required<string>();
	public readonly rows = input.required<MonitoringRowModel[]>();
	public readonly checkedIds = input<ReadonlySet<string>>(new Set());

	public readonly checkedChange = output<CheckedChangeModel>();
	public readonly moreRequested = output();
	public readonly retried = output();

	protected readonly memberSkeletonRows: number = MEMBER_SKELETON_ROWS;
	protected readonly hasMore = computed(() => CumulativePageHelper.hasMore(this.block().element));
}
