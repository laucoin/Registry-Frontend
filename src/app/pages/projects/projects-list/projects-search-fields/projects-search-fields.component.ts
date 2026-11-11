import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { ProjectFacade } from '@pages/projects/data/state/project/project.facade';
import { PROJECTS_SORT_FIELDS, ProjectsListSearchModel } from '@pages/projects/projects-list/projects-list.search';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/input';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Champs de recherche de la liste des projets.
 * Périmètre: Lie le texte, la date, la visibilité, les favoris, la présence d'un profil et le tri au formulaire de la
 * page, et signale quand l'utilisateur valide le texte saisi.
 * Limites: Ne lance pas la recherche ; la page le fait. Les filtres de visibilité et de profil ne s'affichent qu'aux
 * utilisateurs autorisés, selon ce que la page indique.
 */
@Component({
	selector: 'app-projects-search-fields',
	imports: [TranslocoPipe, FormField, SgdfFieldDirective, BooleanChoicePipe, SortFieldsComponent],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './projects-search-fields.component.html',
})
export class ProjectsSearchFieldsComponent {
	protected readonly facade = inject(ProjectFacade);
	protected readonly sortFields: readonly string[] = PROJECTS_SORT_FIELDS;

	public readonly form = input.required<FieldTree<ProjectsListSearchModel>>();
	public readonly canSeeHidden = input.required<boolean>();
	public readonly canReadAll = input.required<boolean>();
	public readonly searched = output();
}
