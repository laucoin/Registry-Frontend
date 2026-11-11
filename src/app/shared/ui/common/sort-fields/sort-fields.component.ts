import { Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';

import { TranslocoPipe } from '@jsverse/transloco';

import { SgdfFieldDirective } from '@shared/directives/sgdf-field.directive';
import { SortDirectionEnum } from '@shared/models/enumeration/sort-direction.enum';

import '@sgdf/ui/option';
import '@sgdf/ui/select';

/**
 * Objectif: Champs « Trier par » et « Ordre » du formulaire de recherche d'une liste.
 * Périmètre: Lie un select de champ de tri, parmi la liste donnée, et un select de sens aux champs `sortBy` et `sortDirection` du formulaire ; s'insère dans la grille du formulaire.
 * Limites: Ne détient aucun état, ne lance aucune recherche et ne connaît pas l'URL ; la page applique le tri à la soumission.
 */
@Component({
	selector: 'app-sort-fields',
	imports: [FormField, SgdfFieldDirective, TranslocoPipe],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	styles: ':host { display: contents; }',
	templateUrl: './sort-fields.component.html',
})
export class SortFieldsComponent {
	protected readonly SortDirectionEnum = SortDirectionEnum;

	public readonly sortBy = input.required<FieldTree<string>>();
	public readonly sortDirection = input.required<FieldTree<SortDirectionEnum>>();
	public readonly fields = input.required<readonly string[]>();
}
