import { ComponentHarness } from '@angular/cdk/testing';

import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { SelectElementsFieldHarness } from '@shared/ui/common/select-elements-field/testing/select-elements-field.harness';

/**
 * Objectif: Pilote les champs d'une invitation à un projet dans les tests.
 * Périmètre: Lit les rôles proposés, leur chargement, l'indication du rôle et le titre des invités ; choisit un rôle et donne le champ de
 * sélection des utilisateurs.
 * Limites: Ne saisit pas les dates ; la sélection est pilotée par le harness du champ de sélection.
 */
export class ProjectProfileInvitationFieldsHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-project-profile-invitation-fields';

	private readonly roleSelect = this.locatorFor(byTestId('project-profile-invitation-fields-role-select'));
	private readonly options = this.locatorForAll(
		`${byTestId('project-profile-invitation-fields-role-select')} sgdf-option`,
	);
	private readonly usersHeading = this.locatorFor(byTestId('project-profile-invitation-fields-users-title'));

	public readonly users = this.locatorFor(SelectElementsFieldHarness);

	public async roles(): Promise<string[]> {
		return Promise.all((await this.options()).map(async (option) => (await option.text()).trim()));
	}

	public async rolesLoading(): Promise<boolean> {
		return (await this.roleSelect()).getProperty<boolean>('loading');
	}

	public async rolePlaceholder(): Promise<string> {
		return (await (await this.roleSelect()).getProperty<string>('placeholder')) ?? '';
	}

	public async usersTitle(): Promise<string> {
		return (await (await this.usersHeading()).text()).trim();
	}

	public async chooseRole(value: string): Promise<void> {
		const select = await this.roleSelect();
		await select.setInputValue(value);
		await select.dispatchEvent('change');
	}
}
