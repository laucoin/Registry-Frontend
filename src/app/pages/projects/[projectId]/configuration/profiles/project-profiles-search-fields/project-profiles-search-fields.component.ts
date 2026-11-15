import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { ProjectProfileFacade } from '@pages/projects/[projectId]/configuration/profiles/data/state/project-profile.facade';
import {
	PROJECT_PROFILES_LIST_SORT_FIELDS,
	ProjectProfilesListSearchModel,
} from '@pages/projects/[projectId]/configuration/profiles/project-profiles-list/project-profiles-list.search';
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
 * Objectif: Champs de recherche de la liste des profils d'un projet.
 * Périmètre: Lie le texte, la date, le statut, la disponibilité, le blocage et le tri au formulaire de la page, et
 * signale quand l'utilisateur valide le texte saisi.
 * Limites: Ne lance pas la recherche ; la page le fait. Le filtre des profils bloqués ne s'affiche qu'aux utilisateurs
 * qui peuvent débloquer un profil.
 */
@Component({
	selector: 'app-project-profiles-search-fields',
	imports: [
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		BooleanChoicePipe,
		SortFieldsComponent,
		IfProjectAuthorityDirective,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './project-profiles-search-fields.component.html',
})
export class ProjectProfilesSearchFieldsComponent {
	protected readonly facade = inject(ProjectProfileFacade);
	protected readonly sortFields: readonly string[] = PROJECT_PROFILES_LIST_SORT_FIELDS;
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_PROFILE_RESTORE;

	public readonly form = input.required<FieldTree<ProjectProfilesListSearchModel>>();
	public readonly searched = output();
}
