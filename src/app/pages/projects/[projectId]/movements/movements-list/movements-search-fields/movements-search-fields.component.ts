import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { MovementFacade } from '@pages/projects/[projectId]/movements/data/state/movement.facade';
import {
	MOVEMENTS_LIST_SORT_FIELDS,
	MovementsListSearchModel,
} from '@pages/projects/[projectId]/movements/movements-list/movements-list.search';
import { IfProjectAuthorityDirective } from '@shared/directives/if-project-authority.directive';
import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { BooleanChoicePipe } from '@shared/helpers/pipe/boolean-choice.pipe';
import { ProjectAuthorityEnum } from '@shared/models/enumeration/project-authority.enum';
import { SortFieldsComponent } from '@shared/ui/common/sort-fields/sort-fields.component';

import '@sgdf/ui/date-time-picker';
import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Champs de recherche de la liste des mouvements.
 * Périmètre: Lie la période, le type, la visibilité et le tri au formulaire de la page.
 * Limites: Ne lance pas la recherche ; la page le fait. Le filtre de visibilité ne s'affiche qu'aux utilisateurs qui
 * peuvent restaurer un mouvement.
 */
@Component({
	selector: 'app-movements-search-fields',
	imports: [
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		BooleanChoicePipe,
		SortFieldsComponent,
		IfProjectAuthorityDirective,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './movements-search-fields.component.html',
})
export class MovementsSearchFieldsComponent {
	protected readonly facade = inject(MovementFacade);
	protected readonly sortFields: readonly string[] = MOVEMENTS_LIST_SORT_FIELDS;
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_MOVEMENT_RESTORE;

	public readonly form = input.required<FieldTree<MovementsListSearchModel>>();
}
