import { ComponentHarness, TestElement } from '@angular/cdk/testing';

import { AccountDeletionDialogHarness } from '@pages/my-account/account-personal-data/account-deletion-dialog/testing/account-deletion-dialog.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';

/**
 * Objectif: Pilote la section des données personnelles de la page de compte dans les tests.
 * Périmètre: Lit le titre, le lien vers la confidentialité et l'état des actions, demande l'export et ouvre la demande de suppression ;
 * donne le dialogue de confirmation.
 * Limites: Ne lit pas les textes d'explication des actions.
 */
export class AccountPersonalDataHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-account-personal-data';

	private readonly heading = this.locatorFor(byTestId('account-personal-data-title'));
	private readonly learnMore = this.locatorFor(byTestId('account-personal-data-learn-more-link'));
	private readonly exportButton = this.locatorFor(byTestId('account-personal-data-export-button'));
	private readonly deleteButton = this.locatorFor(byTestId('account-personal-data-delete-button'));

	public readonly deletionDialog = this.locatorFor(AccountDeletionDialogHarness);

	public async title(): Promise<string> {
		return (await (await this.heading()).text()).trim();
	}

	public async privacyLink(): Promise<string | null> {
		return (await this.learnMore()).getAttribute('href');
	}

	public async actionStates(): Promise<Record<'export' | 'deletion', { loading: boolean; disabled: boolean }>> {
		const state = async (button: TestElement): Promise<{ loading: boolean; disabled: boolean }> => ({
			loading: await button.getProperty<boolean>('loading'),
			disabled: await button.getProperty<boolean>('disabled'),
		});
		return { export: await state(await this.exportButton()), deletion: await state(await this.deleteButton()) };
	}

	public async export(): Promise<void> {
		return (await this.exportButton()).click();
	}

	public async requestDeletion(): Promise<void> {
		return (await this.deleteButton()).click();
	}
}
