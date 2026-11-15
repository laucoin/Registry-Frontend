import { ComponentHarness } from '@angular/cdk/testing';

import { ParticipantFormHarness } from '@pages/projects/[projectId]/configuration/participants/participant-form/testing/participant-form.harness';
import { ParticipantGroupsDialogHarness } from '@pages/projects/[projectId]/configuration/participants/participant-groups-dialog/testing/participant-groups-dialog.harness';
import { ParticipantRowHarness } from '@pages/projects/[projectId]/configuration/participants/participant-row/testing/participant-row.harness';
import { ParticipantsSearchFieldsHarness } from '@pages/projects/[projectId]/configuration/participants/participants-search-fields/testing/participants-search-fields.harness';
import { byTestId } from '@shared/helpers/testing/harness/test-id';
import { FormActionsHarness } from '@shared/ui/common/form-actions/testing/form-actions.harness';
import { ListHarness } from '@shared/ui/common/list/testing/list.harness';
import { GroupMembersFieldHarness } from '@shared/ui/domain/group-members-field/testing/group-members-field.harness';

export enum GroupMemberLayerEnum {
	ADD_MEMBERS = 'add-members',
	CREATE_MEMBER = 'create-member',
}

/**
 * Objectif: Pilote la page des membres d'un groupe dans les tests.
 * Périmètre: Lit le titre et les actions proposées, ouvre, lit et ferme les couches d'ajout et de création de membres,
 * ajoute les membres choisis, et donne la liste, la recherche, les lignes et le dialogue des groupes.
 * Limites: Les harnesses des champs et des lignes pilotent leur contenu.
 */
export class GroupMemberListHarness extends ComponentHarness {
	public static readonly hostSelector = 'app-group-member-list';

	private readonly heading = this.locatorFor(byTestId('group-member-list-title'));
	private readonly skeleton = this.locatorForOptional(byTestId('group-member-list-title-skeleton'));
	private readonly addForm = this.locatorFor(byTestId('group-member-list-add-members-form'));

	public readonly list = this.locatorFor(ListHarness);
	public readonly search = this.locatorFor(ParticipantsSearchFieldsHarness);
	public readonly rows = this.locatorForAll(ParticipantRowHarness);
	public readonly groupsDialog = this.locatorFor(ParticipantGroupsDialogHarness);
	public readonly members = this.locatorFor(GroupMembersFieldHarness);
	public readonly addActions = this.locatorFor(FormActionsHarness);
	public readonly memberForm = this.locatorForOptional(ParticipantFormHarness);

	public async title(): Promise<string | undefined> {
		if (await this.skeleton()) return undefined;
		return (await (await this.heading()).text({ exclude: 'sgdf-button' })).trim();
	}

	public async actions(): Promise<GroupMemberLayerEnum[]> {
		const shown: GroupMemberLayerEnum[] = [];
		for (const layer of Object.values(GroupMemberLayerEnum)) {
			if (await this.locatorForOptional(this.button(layer))()) shown.push(layer);
		}
		return shown;
	}

	public async open(layer: GroupMemberLayerEnum): Promise<void> {
		return (await this.locatorFor(this.button(layer))()).click();
	}

	public async opened(layer: GroupMemberLayerEnum): Promise<boolean> {
		return (await this.locatorFor(this.drawer(layer))()).getProperty<boolean>('open');
	}

	public async hide(layer: GroupMemberLayerEnum): Promise<void> {
		return (await this.locatorFor(this.drawer(layer))()).dispatchEvent('sgdf-hide');
	}

	public async addMembers(): Promise<void> {
		return (await this.addForm()).dispatchEvent('submit');
	}

	private button(layer: GroupMemberLayerEnum): string {
		return byTestId(`group-member-list-${layer}-button`);
	}

	private drawer(layer: GroupMemberLayerEnum): string {
		return byTestId(`group-member-list-${layer}-drawer`);
	}
}
