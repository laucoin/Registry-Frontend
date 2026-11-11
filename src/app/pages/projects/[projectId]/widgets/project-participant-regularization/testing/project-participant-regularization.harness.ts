import { ComponentHarness } from '@angular/cdk/testing';

import { OverdueParticipantsDialogHarness } from '@pages/projects/[projectId]/widgets/overdue-participants-dialog/testing/overdue-participants-dialog.harness';
import { RegularizationRowHarness } from '@pages/projects/[projectId]/widgets/regularization-row/testing/regularization-row.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';
import { SkeletonListHarness } from '@shared/ui/common/skeleton-list/testing/skeleton-list.harness';

/**
 * Objectif: Pilote le widget des participants à régulariser de l'accueil projet dans les tests.
 * Périmètre: Lit le titre, le total, l'état vide et le bouton « voir tout » ; donne les lignes, le squelette, l'erreur
 * et le dialogue de la liste complète, et ouvre ce dialogue.
 * Limites: Ne lit pas les icônes.
 */
export class ProjectParticipantRegularizationHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-participant-regularization';

	private readonly heading = this.locatorFor(byTestId('widget-card-title'));
	private readonly totalTag = this.locatorForOptional(byTestId('widget-card-total'));
	private readonly emptyText = this.locatorForOptional(byTestId('widget-card-empty'));
	private readonly seeAllButton = this.locatorFor(byTestId('project-participant-regularization-see-all-button'));

	public readonly rows = this.locatorForAll(RegularizationRowHarness);
	public readonly skeleton = this.locatorForOptional(SkeletonListHarness);
	public readonly error = this.locatorForOptional(SectionErrorHarness);
	public readonly dialog = this.locatorFor(OverdueParticipantsDialogHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async total(): Promise<string | undefined> {
		return (await (await this.totalTag())?.text())?.trim();
	}

	public async empty(): Promise<string | undefined> {
		return (await (await this.emptyText())?.text())?.trim();
	}

	public async seeAllText(): Promise<string> {
		return (await (await this.seeAllButton()).text()).trim();
	}

	public async seeAll(): Promise<void> {
		return (await this.seeAllButton()).click();
	}
}
