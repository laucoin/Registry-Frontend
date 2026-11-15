import { ComponentHarness } from '@angular/cdk/testing';

import { UserElementHarness } from '@pages/projects/[projectId]/configuration/profiles/project-profile-form/project-profile-edition-form/user-element/testing/user-element.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormDialogHarness } from '@shared/ui/common/form-dialog/testing/form-dialog.harness';

/**
 * Objectif: Pilote le dialogue d'édition d'un profil de projet dans les tests.
 * Périmètre: Donne le dialogue et le résumé de l'utilisateur ; lit les rôles proposés et le rôle choisi, et choisit un
 * rôle.
 * Limites: Ne saisit pas les dates ; le harness du dialogue pilote la soumission et la fermeture.
 */
export class ProjectProfileEditionFormHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-profile-edition-form';

	private readonly roleSelect = this.locatorFor(byTestId('project-profile-edition-form-role-select'));
	private readonly options = this.locatorForAll(
		`${byTestId('project-profile-edition-form-role-select')} sgdf-option`,
	);

	public readonly dialog = this.locatorFor(FormDialogHarness);
	public readonly user = this.locatorForOptional(UserElementHarness);

	public async roles(): Promise<string[]> {
		return Promise.all((await this.options()).map(async (option) => (await option.text()).trim()));
	}

	public async role(): Promise<string> {
		return (await (await this.roleSelect()).getProperty<string | null>('value')) ?? '';
	}

	public async chooseRole(value: string): Promise<void> {
		const select = await this.roleSelect();
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}
}
