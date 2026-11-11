import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, input, output } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import {
	ALERTS_LIST_SORT_FIELDS,
	AlertsListSearchModel,
} from '@pages/projects/[projectId]/alerts/alerts-list/alerts-list.search';
import { AlertFacade } from '@pages/projects/[projectId]/alerts/data/state/alert.facade';
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
 * Objectif: Champs de recherche de la liste des alertes.
 * Périmètre: Lie le texte, le statut, la visibilité, la période et le tri au formulaire de la page, et signale quand
 * l'utilisateur valide le texte saisi.
 * Limites: Ne lance pas la recherche ; la page le fait. Le filtre de visibilité ne s'affiche qu'aux utilisateurs qui
 * peuvent restaurer une alerte.
 */
@Component({
	selector: 'app-alerts-search-fields',
	imports: [
		TranslocoPipe,
		FormField,
		SgdfFieldDirective,
		BooleanChoicePipe,
		SortFieldsComponent,
		IfProjectAuthorityDirective,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './alerts-search-fields.component.html',
})
export class AlertsSearchFieldsComponent {
	protected readonly facade = inject(AlertFacade);
	protected readonly sortFields: readonly string[] = ALERTS_LIST_SORT_FIELDS;
	protected readonly hiddenAuthority: ProjectAuthorityEnum = ProjectAuthorityEnum.REGISTRY_PROJECT_ALERT_RESTORE;

	public readonly form = input.required<FieldTree<AlertsListSearchModel>>();
	public readonly searched = output();
}
