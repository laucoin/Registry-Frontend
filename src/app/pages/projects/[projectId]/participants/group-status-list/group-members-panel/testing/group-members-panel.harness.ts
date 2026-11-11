import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { LoadMoreHarness } from '@shared/ui/common/load-more/testing/load-more.harness';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';
import { MonitoringRowHarness } from '@shared/ui/domain/monitoring-row/testing/monitoring-row.harness';

/**
 * Objectif: Pilote les membres sur site d'un groupe ouvert dans les tests.
 * Périmètre: Lit l'absence de membre ; donne le squelette, l'erreur, les lignes et le chargement de la suite.
 * Limites: Les lignes ont leur propre harness.
 */
export class GroupMembersPanelHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-group-members-panel';

	private readonly emptyText = this.locatorForOptional(byTestId('group-members-panel-empty'));

	public readonly skeleton = this.locatorForOptional(SkeletonListHarness);
	public readonly error = this.locatorForOptional(SectionErrorHarness);
	public readonly rows = this.locatorForAll(MonitoringRowHarness);
	public readonly loadMore = this.locatorForOptional(LoadMoreHarness);

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}
}
