import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormDialogHarness } from '@shared/ui/common/form-dialog/testing/form-dialog.harness';
import { SectionErrorHarness } from '@shared/ui/common/section-error/testing/section-error.harness';

/**
 * Objectif: Pilote le dialogue de changement de rôle d'un utilisateur dans les tests.
 * Périmètre: Donne le dialogue de formulaire et l'erreur de chargement ; lit les rôles proposés et le rôle choisi, et
 * choisit un rôle.
 * Limites: Ne lit pas l'indication du champ.
 */
export class UserFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-user-form';

	private readonly roleSelect = this.locatorForOptional(byTestId('user-form-role-select'));
	private readonly options = this.locatorForAll(`${byTestId('user-form-role-select')} sgdf-option`);

	public readonly dialog = this.locatorFor(FormDialogHarness);
	public readonly loadError = this.locatorForOptional(SectionErrorHarness);

	public async roles(): Promise<string[]> {
		return Promise.all((await this.options()).map(async (option) => (await option.text()).trim()));
	}

	public async role(): Promise<string | undefined> {
		return (await this.roleSelect())?.getProperty<string>('value');
	}

	public async chooseRole(value: string): Promise<void> {
		const select = await this.roleSelect();
		await select?.setInputValue(value);
		await select?.dispatchEvent('change');
	}
}
