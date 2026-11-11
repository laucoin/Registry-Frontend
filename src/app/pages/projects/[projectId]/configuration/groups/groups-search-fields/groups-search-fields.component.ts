import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { GroupFacade } from '@pages/projects/[projectId]/configuration/groups/data/state/group.facade';
import {
	GROUPS_LIST_SORT_FIELDS,
	GroupsListSearchModel,
} from '@pages/projects/[projectId]/configuration/groups/groups-list/groups-list.search';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Champs de recherche de la liste des groupes.
 * Périmètre: Lie le texte, la date, la présence, la visibilité et le tri au formulaire de la page, et signale
 * quand l'utilisateur valide le texte saisi.
 * Limites: Ne lance pas la recherche ; la page le fait. Le filtre de visibilité ne s'affiche qu'aux utilisateurs qui
 * peuvent restaurer un groupe.
 */
@Component({
	selector: 'app-groups-search-fields',
	imports: [
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		BooleanChoicePipe,
		SortFieldsComponent,
		IfProjectAuthorityDirective,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './groups-search-fields.component.html',
})
export class GroupsSearchFieldsComponent {
	protected readonly facade = inject(GroupFacade);
	protected readonly sortFields: readonly string[] = GROUPS_LIST_SORT_FIELDS;
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_GROUP_RESTORE;

	public readonly form = input.required<FieldTree<GroupsListSearchModel>>();
	public readonly searched = output();
}
