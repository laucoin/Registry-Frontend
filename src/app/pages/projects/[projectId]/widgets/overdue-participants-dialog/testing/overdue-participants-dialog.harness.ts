import { ComponentHarness } from '@angular/cdk/testing';

import { RegularizationRowHarness } from '@pages/projects/[projectId]/widgets/regularization-row/testing/regularization-row.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';

/**
 * Objectif: Pilote le dialogue de la liste complète des participants à régulariser dans les tests.
 * Périmètre: Lit l'ouverture du dialogue, donne la liste et ses lignes, et signale l'ouverture ou la fermeture du
 * dialogue comme le ferait le composant.
 * Limites: `sgdf-dialog` garde `open` pendant son animation de fermeture : la fermeture se vérifie sur l'hôte.
 */
export class OverdueParticipantsDialogHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-overdue-participants-dialog';

	private readonly modal = this.locatorFor(byTestId('overdue-participants-dialog-modal'));

	public readonly list = this.locatorForOptional(ListHarness);
	public readonly rows = this.locatorForAll(RegularizationRowHarness);

	public async isOpen(): Promise<boolean> {
		return (await this.modal()).getProperty<boolean>('open');
	}

	public async shown(): Promise<void> {
		return (await this.modal()).dispatchEvent('sgdf-show');
	}

	public async hide(): Promise<void> {
		return (await this.modal()).dispatchEvent('sgdf-hide');
	}
}
